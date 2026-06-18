import { remoteUploadRegisterService } from '@/services/remoteUploadRegisterService';

const STORAGE_KEY = 'rra_dev_image_assets_v1';
const DATA_KEY_PREFIX = '__data__:';
const ALIAS_PREFIX = '__alias__:';
const FALLBACK_IMAGE_PATH = '/images/PIAA%20Image%20Unavailable.jpg';

type ImageAssetMap = Record<string, string>;
const UPLOAD_REGISTER_STORAGE_KEY = 'rra_dev_image_upload_register_v1';

export interface ImageUploadRegisterEntry {
  id: string;
  uploadedAt: string;
  fileCount: number;
  references: string[];
}

export interface RebuildUploadRegisterResult {
  createdEntries: number;
  referencesTracked: number;
}
export interface StoreImageOptions {
  maxImageSizeKb?: number;
  onProgress?: (event: {
    index: number;
    total: number;
    fileName: string;
    stage: 'reading' | 'compressing' | 'storing' | 'done';
  }) => void;
}

const THUMBNAIL_MAX_DIMENSION = 320;
const THUMBNAIL_QUALITY = 0.82;

const normalizeKey = (value: string): string => value.trim().toLowerCase();
const normalizeCompact = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const makeDataKey = (normalizedReference: string): string => `${DATA_KEY_PREFIX}${normalizedReference}`;

const makeAliasValue = (dataKey: string): string => `${ALIAS_PREFIX}${dataKey}`;

const resolveStoredValue = (assets: ImageAssetMap, key: string): string | null => {
  let value = assets[key];
  if (!value) {
    return null;
  }

  // Backward-compatible: older entries store a data URL directly against each lookup key.
  if (!value.startsWith(ALIAS_PREFIX)) {
    return value;
  }

  // Follow alias indirection (with a tiny guard against accidental cycles).
  let safety = 0;
  while (value?.startsWith(ALIAS_PREFIX) && safety < 4) {
    const targetKey = value.slice(ALIAS_PREFIX.length);
    value = assets[targetKey];
    safety += 1;
  }

  return value ?? null;
};

const getBaseName = (filename: string): string => {
  const trimmed = filename.trim();
  const lastDot = trimmed.lastIndexOf('.');
  return lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
};

const readAssets = (): ImageAssetMap => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ImageAssetMap;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const readUploadRegister = (): ImageUploadRegisterEntry[] => {
  const raw = localStorage.getItem(UPLOAD_REGISTER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ImageUploadRegisterEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: String(item.id || ''),
        uploadedAt: String(item.uploadedAt || ''),
        fileCount: Number(item.fileCount || 0),
        references: Array.isArray(item.references) ? item.references.map((ref) => String(ref)) : [],
      }))
      .filter((item) => item.id && item.uploadedAt);
  } catch {
    return [];
  }
};

const writeUploadRegister = (entries: ImageUploadRegisterEntry[]): void => {
  localStorage.setItem(UPLOAD_REGISTER_STORAGE_KEY, JSON.stringify(entries));
};

const useRemoteApi = String(import.meta.env.VITE_USE_REMOTE_API ?? 'false') === 'true';

const writeAssets = (assets: ImageAssetMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    const maybeDom = error as DOMException;
    if (maybeDom?.name === 'QuotaExceededError') {
      throw new Error(
        'Browser storage quota exceeded while saving images. Use fewer images at once, lower admin image size setting, or clear old stored graphics.',
      );
    }
    throw error;
  }
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image for compression.'));
    image.src = dataUrl;
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL.'));
    reader.readAsDataURL(blob);
  });

const createThumbnailDataUrl = async (dataUrl: string): Promise<string> => {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return dataUrl;
  }

  // Important: draw to target canvas dimensions.
  // Without explicit destination width/height, browsers draw at natural image size,
  // which clips to top-left when canvas is smaller than source.
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', THUMBNAIL_QUALITY));
  if (!blob) {
    return dataUrl;
  }

  return blobToDataUrl(blob);
};

const compressDataUrlToMaxSize = async (dataUrl: string, maxKb: number): Promise<string> => {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  const MAX_DIMENSION = 900;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return dataUrl;
  }

  // Scale source to canvas dimensions to avoid top-left clipping.
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let output = dataUrl;

  while (quality >= 0.22) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) {
      break;
    }

    if (blob.size <= maxKb * 1024) {
      output = await blobToDataUrl(blob);
      break;
    }

    output = await blobToDataUrl(blob);
    quality -= 0.08;
  }

  return output;
};

const sanitizeReference = (value: string): string => value.trim().replace(/\\/g, '/').replace(/^\/+/, '');

const toPublicAssetPath = (reference: string): string => {
  const clean = sanitizeReference(reference)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return clean ? `/assets/${clean}` : '/assets';
};

const getFolderAndFile = (reference: string): { folder: string | null; filename: string } => {
  const parts = reference.split('/').filter(Boolean);
  if (parts.length <= 1) {
    return { folder: null, filename: parts[0] ?? reference };
  }

  return {
    folder: parts[0] ?? null,
    filename: parts[parts.length - 1] ?? reference,
  };
};

const storeSingleFile = async (
  assets: ImageAssetMap,
  file: File,
  reference: string,
  options?: StoreImageOptions,
  progressMeta?: { index: number; total: number },
): Promise<string> => {
  const normalizedReference = sanitizeReference(reference || file.name);
  // localStorage quota is small in-browser; keep individual assets compact by default.
  const maxImageSizeKb = Math.min(options?.maxImageSizeKb ?? 60, 60);

  options?.onProgress?.({
    index: progressMeta?.index ?? 1,
    total: progressMeta?.total ?? 1,
    fileName: file.name,
    stage: 'reading',
  });

  let dataUrl = await readFileAsDataUrl(file);
  if (file.type.startsWith('image/') && file.size > maxImageSizeKb * 1024) {
    try {
      options?.onProgress?.({
        index: progressMeta?.index ?? 1,
        total: progressMeta?.total ?? 1,
        fileName: file.name,
        stage: 'compressing',
      });
      dataUrl = await compressDataUrlToMaxSize(dataUrl, maxImageSizeKb);
    } catch {
      // If compression fails for any reason, continue with original file.
    }
  }

  if (!dataUrl) {
    return normalizedReference;
  }

  const { folder, filename } = getFolderAndFile(normalizedReference);
  const fullNameKey = normalizeKey(filename);
  const baseNameKey = normalizeKey(getBaseName(filename));
  const referenceKey = normalizeKey(normalizedReference);
  const dataKey = makeDataKey(referenceKey);

  const setAlias = (aliasKey: string) => {
    assets[aliasKey] = makeAliasValue(dataKey);
  };

  options?.onProgress?.({
    index: progressMeta?.index ?? 1,
    total: progressMeta?.total ?? 1,
    fileName: file.name,
    stage: 'storing',
  });

  assets[dataKey] = dataUrl;
  setAlias(referenceKey);
  setAlias(fullNameKey);
  setAlias(baseNameKey);

  if (folder) {
    setAlias(normalizeKey(`${folder}/${filename}`));
    setAlias(normalizeKey(`${folder}/${getBaseName(filename)}`));
  }

  options?.onProgress?.({
    index: progressMeta?.index ?? 1,
    total: progressMeta?.total ?? 1,
    fileName: file.name,
    stage: 'done',
  });

  return normalizedReference;
};

export const imageAssetService = {
  getFallbackImagePath(): string {
    return FALLBACK_IMAGE_PATH;
  },

  async syncUploadRegisterFromRemote(): Promise<void> {
    if (!useRemoteApi) {
      return;
    }

    try {
      const entries = await remoteUploadRegisterService.list();
      if (entries.length > 0) {
        writeUploadRegister(entries);
      }
    } catch {
      // Non-fatal: keep local register fallback.
    }
  },

  getUploadRegister(): ImageUploadRegisterEntry[] {
    return readUploadRegister().sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
  },

  recordUploadBatch(references: string[]): void {
    const cleaned = [...new Set(references.map((ref) => sanitizeReference(ref)).filter(Boolean))];
    if (cleaned.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const entries = readUploadRegister();
    entries.push({
      id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uploadedAt: now,
      fileCount: cleaned.length,
      references: cleaned,
    });
    const latest = entries[entries.length - 1];

    // Keep register bounded and practical in localStorage.
    writeUploadRegister(entries.slice(-200));
    if (useRemoteApi && latest) {
      void remoteUploadRegisterService.record(latest);
    }
  },

  rebuildUploadRegisterFromReferences(references: string[]): RebuildUploadRegisterResult {
    const cleaned = [...new Set(references.map((ref) => sanitizeReference(ref)).filter(Boolean))];
    if (cleaned.length === 0) {
      writeUploadRegister([]);
      return { createdEntries: 0, referencesTracked: 0 };
    }

    const inferredEntry: ImageUploadRegisterEntry = {
      id: `backfill_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      fileCount: cleaned.length,
      references: cleaned,
    };

    writeUploadRegister([inferredEntry]);
    return { createdEntries: 1, referencesTracked: cleaned.length };
  },

  listStoredReferences(): string[] {
    const assets = readAssets();
    const aliasKeys = Object.keys(assets).filter((key) => !key.startsWith(DATA_KEY_PREFIX));
    const likelyReferences = aliasKeys.filter((key) => {
      if (!key.includes('/')) {
        return false;
      }

      const filename = key.split('/').pop() ?? '';
      return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)$/i.test(filename);
    });

    return [...new Set(likelyReferences)].sort((a, b) => a.localeCompare(b));
  },

  isReferenceStored(reference: string): boolean {
    if (!reference) {
      return false;
    }

    const assets = readAssets();
    const key = normalizeKey(reference);
    return Boolean(resolveStoredValue(assets, key));
  },

  async storeFiles(files: File[], options?: StoreImageOptions): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const assets = readAssets();

    for (const [index, file] of files.entries()) {
      await storeSingleFile(assets, file, file.name, options, { index: index + 1, total: files.length });
    }

    writeAssets(assets);
  },

  async storeFilesWithReferences(
    filesWithReferences: Array<{ file: File; reference: string }>,
    options?: StoreImageOptions,
  ): Promise<string[]> {
    if (filesWithReferences.length === 0) {
      return [];
    }

    const assets = readAssets();
    const references: string[] = [];

    for (const [index, item] of filesWithReferences.entries()) {
      const storedReference = await storeSingleFile(assets, item.file, item.reference, options, {
        index: index + 1,
        total: filesWithReferences.length,
      });
      references.push(storedReference);
    }

    writeAssets(assets);
    this.recordUploadBatch(references);
    return references;
  },

  async storePrimaryThumbnailsBySku(
    filesWithReferences: Array<{ file: File; reference: string; sku: string; isMain?: boolean }>,
    options?: StoreImageOptions,
  ): Promise<string[]> {
    if (filesWithReferences.length === 0) {
      return [];
    }

    const bySku = new Map<string, Array<{ file: File; reference: string; sku: string; isMain?: boolean }>>();
    filesWithReferences.forEach((item) => {
      const key = item.sku.trim().toLowerCase();
      if (!key) {
        return;
      }
      const list = bySku.get(key) ?? [];
      list.push(item);
      bySku.set(key, list);
    });

    const assets = readAssets();
    const skus = [...bySku.keys()];
    const storedReferences: string[] = [];

    for (const [index, sku] of skus.entries()) {
      const items = bySku.get(sku) ?? [];
      const selected = items.find((item) => item.isMain) ?? items[0];
      if (!selected) {
        continue;
      }

      options?.onProgress?.({
        index: index + 1,
        total: skus.length,
        fileName: selected.file.name,
        stage: 'reading',
      });

      let dataUrl = await readFileAsDataUrl(selected.file);
      options?.onProgress?.({
        index: index + 1,
        total: skus.length,
        fileName: selected.file.name,
        stage: 'compressing',
      });
      dataUrl = await createThumbnailDataUrl(dataUrl);

      const normalizedReference = sanitizeReference(selected.reference || selected.file.name);
      const { folder, filename } = getFolderAndFile(normalizedReference);
      const fullNameKey = normalizeKey(filename);
      const baseNameKey = normalizeKey(getBaseName(filename));
      const referenceKey = normalizeKey(normalizedReference);
      const dataKey = makeDataKey(referenceKey);

      const setAlias = (aliasKey: string) => {
        assets[aliasKey] = makeAliasValue(dataKey);
      };

      options?.onProgress?.({
        index: index + 1,
        total: skus.length,
        fileName: selected.file.name,
        stage: 'storing',
      });

      assets[dataKey] = dataUrl;
      setAlias(referenceKey);
      setAlias(fullNameKey);
      setAlias(baseNameKey);
      if (folder) {
        setAlias(normalizeKey(`${folder}/${filename}`));
        setAlias(normalizeKey(`${folder}/${getBaseName(filename)}`));
      }

      options?.onProgress?.({
        index: index + 1,
        total: skus.length,
        fileName: selected.file.name,
        stage: 'done',
      });

      storedReferences.push(normalizedReference);
    }

    writeAssets(assets);
    this.recordUploadBatch(storedReferences);
    return storedReferences;
  },

  resolveImage(reference: string): string | null {
    if (!reference) {
      return FALLBACK_IMAGE_PATH;
    }

    if (reference.startsWith('http://') || reference.startsWith('https://') || reference.startsWith('/')) {
      return reference;
    }

    const assets = readAssets();
    const key = normalizeKey(reference);
    const stored = resolveStoredValue(assets, key);
    if (stored) {
      return stored;
    }

    // Fallback: allow direct public asset references when files are deployed in /public/assets
    // or served from production /assets without requiring localStorage image uploads.
    return toPublicAssetPath(reference);
  },

  removeReference(reference: string): void {
    if (!reference) {
      return;
    }

    const assets = readAssets();
    const referenceKey = normalizeKey(reference);
    const storedValue = assets[referenceKey];

    if (!storedValue) {
      return;
    }

    const getDataKey = (): string | null => {
      if (storedValue.startsWith(ALIAS_PREFIX)) {
        return storedValue.slice(ALIAS_PREFIX.length);
      }

      if (referenceKey.startsWith(DATA_KEY_PREFIX)) {
        return referenceKey;
      }

      return null;
    };

    const dataKey = getDataKey();

    if (dataKey) {
      const aliasValue = makeAliasValue(dataKey);
      Object.keys(assets).forEach((key) => {
        if (assets[key] === aliasValue) {
          delete assets[key];
        }
      });

      delete assets[dataKey];
    }

    delete assets[referenceKey];
    writeAssets(assets);
  },

  clear(): void {
    writeAssets({});
  },

  findReferencesBySku(sku: string, preferredCategory?: string): string[] {
    const skuKey = normalizeKey(sku);
    const skuCompact = normalizeCompact(sku);
    if (!skuKey) {
      return [];
    }

    const assets = readAssets();
    const aliasKeys = Object.keys(assets).filter((key) => !key.startsWith(DATA_KEY_PREFIX));
    const skuPrefix = `${skuKey}`;

    const strictMatches = aliasKeys.filter((key) => {
      const filename = key.split('/').pop() ?? key;
      const base = getBaseName(filename);
      const normalizedBase = normalizeKey(base);

      const tokenMatch =
        normalizedBase === skuPrefix ||
        normalizedBase.startsWith(`${skuPrefix} `) ||
        normalizedBase.startsWith(`${skuPrefix}-`) ||
        normalizedBase.startsWith(`${skuPrefix}_`) ||
        normalizedBase.includes(` ${skuPrefix} `) ||
        normalizedBase.includes(`-${skuPrefix}-`) ||
        normalizedBase.includes(`_${skuPrefix}_`);

      return tokenMatch;
    });

    const matches = strictMatches.length > 0
      ? strictMatches
      : aliasKeys.filter((key) => {
          const compactKey = normalizeCompact(key);
          return skuCompact.length >= 3 && compactKey.includes(skuCompact);
        });

    const ranked = [...new Set(matches)].sort((a, b) => {
      const aCategoryMatch = preferredCategory ? a.startsWith(normalizeKey(preferredCategory) + '/') : false;
      const bCategoryMatch = preferredCategory ? b.startsWith(normalizeKey(preferredCategory) + '/') : false;
      if (aCategoryMatch !== bCategoryMatch) {
        return aCategoryMatch ? -1 : 1;
      }

      const aMain = /(?:^|[\s_-])main(?:\.|$)/.test(a);
      const bMain = /(?:^|[\s_-])main(?:\.|$)/.test(b);
      if (aMain !== bMain) {
        return aMain ? -1 : 1;
      }

      return a.localeCompare(b);
    });

    return ranked;
  },

  findReferencesByText(text: string, preferredCategory?: string): string[] {
    const normalizedText = normalizeCompact(text);
    if (!normalizedText || normalizedText.length < 4) {
      return [];
    }

    const assets = readAssets();
    const aliasKeys = Object.keys(assets).filter((key) => !key.startsWith(DATA_KEY_PREFIX));

    const matches = aliasKeys.filter((key) => {
      const compactKey = normalizeCompact(key);
      return compactKey.includes(normalizedText) || normalizedText.includes(compactKey.slice(0, Math.min(12, compactKey.length)));
    });

    return [...new Set(matches)].sort((a, b) => {
      const aCategoryMatch = preferredCategory ? a.startsWith(normalizeKey(preferredCategory) + '/') : false;
      const bCategoryMatch = preferredCategory ? b.startsWith(normalizeKey(preferredCategory) + '/') : false;
      if (aCategoryMatch !== bCategoryMatch) {
        return aCategoryMatch ? -1 : 1;
      }
      return a.localeCompare(b);
    });
  },
};
