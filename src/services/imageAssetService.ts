const STORAGE_KEY = 'rra_dev_image_assets_v1';
const DATA_KEY_PREFIX = '__data__:';
const ALIAS_PREFIX = '__alias__:';

type ImageAssetMap = Record<string, string>;
export interface StoreImageOptions {
  maxImageSizeKb?: number;
  onProgress?: (event: {
    index: number;
    total: number;
    fileName: string;
    stage: 'reading' | 'compressing' | 'storing' | 'done';
  }) => void;
}

const normalizeKey = (value: string): string => value.trim().toLowerCase();

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

const writeAssets = (assets: ImageAssetMap): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
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

const compressDataUrlToMaxSize = async (dataUrl: string, maxKb: number): Promise<string> => {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0);

  let quality = 0.92;
  let output = dataUrl;

  while (quality >= 0.3) {
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
  const maxImageSizeKb = options?.maxImageSizeKb ?? 200;

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
    return references;
  },

  resolveImage(reference: string): string | null {
    if (!reference) {
      return null;
    }

    if (reference.startsWith('http://') || reference.startsWith('https://') || reference.startsWith('/')) {
      return reference;
    }

    const assets = readAssets();
    const key = normalizeKey(reference);
    return resolveStoredValue(assets, key);
  },

  clear(): void {
    writeAssets({});
  },
};
