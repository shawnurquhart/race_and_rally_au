import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { type Product } from '@/types/product';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import { adminSettingsService } from '@/services/adminSettingsService';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/backend/api';
const GRAPHICS_REMOTE_FOLDER = 'assets/graphics';
const GRAPHICS_REFERENCE_FOLDER = 'graphics';
const IMAGE_UNAVAILABLE_REFERENCE = '/images/PIAA%20Image%20Unavailable.jpg';

const removeExtension = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
};

const sanitizeSku = (value: string): string => value.trim().replace(/\.[^.]+$/, '');
const normalizeSkuForMatch = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeSkuTokenForMatch = (value: string): string => {
  const firstToken = (value || '').trim().split(/\s+/)[0] ?? '';
  return normalizeSkuForMatch(firstToken);
};

const getSkuFromFilename = (filename: string): string => {
  const base = removeExtension(filename).trim();
  if (!base) {
    return '';
  }

  // SKU is defined as everything up to the first space.
  // Keep internal hyphens intact (e.g. HO-12E, Z1-M).
  const firstSpace = base.indexOf(' ');
  const skuToken = firstSpace > 0 ? base.slice(0, firstSpace).trim() : base;
  return sanitizeSku(skuToken);
};

const isMainImageFilename = (filename: string): boolean => {
  const base = removeExtension(filename).trim().toLowerCase();
  return /(?:^|[\s_-])main$/.test(base);
};

const sortImageReferencesForDisplay = (references: string[]): string[] =>
  [...references].sort((a, b) => {
    const aMain = isMainImageFilename(a);
    const bMain = isMainImageFilename(b);
    if (aMain !== bMain) {
      return aMain ? -1 : 1;
    }

    return a.localeCompare(b);
  });

const hasImageExtension = (filename: string): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'].includes(extension);
};

const isGraphicsFilePath = (value: string): boolean => hasImageExtension(value);

const isImageFile = (file: File): boolean => file.type.startsWith('image/') || hasImageExtension(file.name);

type ParsedFilename = {
  original: string;
  sku: string;
  description: string;
  indicator: string;
  isMain: boolean;
  isValid: boolean;
  reason?: string;
};

const parseFilenameMeta = (filename: string): ParsedFilename => {
  const base = removeExtension(filename).trim();
  const firstSpace = base.indexOf(' ');
  if (firstSpace <= 0) {
    return {
      original: filename,
      sku: '',
      description: '',
      indicator: '',
      isMain: false,
      isValid: false,
      reason: 'Filename must include SKU then a space then description.',
    };
  }

  const sku = base.slice(0, firstSpace).trim();
  const remainder = base.slice(firstSpace + 1).trim();
  const dashIndex = remainder.lastIndexOf(' - ');
  const description = dashIndex >= 0 ? remainder.slice(0, dashIndex).trim() : remainder;
  const indicator = dashIndex >= 0 ? remainder.slice(dashIndex + 3).trim() : '';
  const isMain = /(^|\b)main(\b|$)/i.test(indicator);

  const skuValid = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(sku);
  if (!skuValid) {
    return {
      original: filename,
      sku,
      description,
      indicator,
      isMain,
      isValid: false,
      reason: 'SKU prefix contains unsupported characters.',
    };
  }

  // Based on real source filenames, suffix terms vary widely (front/side/horns/remote/etc).
  // So we do NOT fail validation on indicator wording; we only use known hints for display semantics.
  const indicatorValid = true;
  return {
    original: filename,
    sku,
    description,
    indicator,
    isMain,
    isValid: Boolean(description) && indicatorValid,
    reason: !description ? 'Description missing after SKU.' : undefined,
  };
};

const AdminProductUploadPage: React.FC = () => {
  type LinkGraphicsDetailRow = {
    sku: string;
    productName: string;
    previousPrimary: string;
    nextPrimary: string;
    matchedReferences: string[];
    matchSource: 'sku' | 'text';
  };

  type LinkGraphicsReport = {
    matched: LinkGraphicsDetailRow[];
    updated: LinkGraphicsDetailRow[];
    unmatched: Array<{ sku: string; productName: string }>;
  };

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [replaceExistingGraphics, setReplaceExistingGraphics] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [checkPassed, setCheckPassed] = useState(false);
  const [checkedProductsCount, setCheckedProductsCount] = useState(0);
  const [checkedAssets, setCheckedAssets] = useState<Array<{ file: File; reference: string }>>([]);
  const [message, setMessage] = useState<string>('');
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isRepairingImages, setIsRepairingImages] = useState(false);
  const [isAuditingImages, setIsAuditingImages] = useState(false);
  const [isLinkingImages, setIsLinkingImages] = useState(false);
  const [linkGraphicsReportOpen, setLinkGraphicsReportOpen] = useState(false);
  const [linkGraphicsReport, setLinkGraphicsReport] = useState<LinkGraphicsReport>({ matched: [], updated: [], unmatched: [] });
  const [isRebuildingRegister, setIsRebuildingRegister] = useState(false);
  const [cleanupSku, setCleanupSku] = useState('');
  const [isNormalizingOnlineRefs, setIsNormalizingOnlineRefs] = useState(false);
  const [isFlushingGraphicsCache, setIsFlushingGraphicsCache] = useState(false);
  const [isAuditingAndCleaningBrokenRefs, setIsAuditingAndCleaningBrokenRefs] = useState(false);
  const [flushCacheReportOpen, setFlushCacheReportOpen] = useState(false);
  const [flushCacheReportRows, setFlushCacheReportRows] = useState<
    Array<{
      sku: string;
      productName: string;
      reference: string;
      flushedKeys: string[];
    }>
  >([]);
  const [flushCacheReportSummary, setFlushCacheReportSummary] = useState('');
  const [auditSummary, setAuditSummary] = useState<string>('');
  const [lastImportSummary, setLastImportSummary] = useState<string>('');
  const [uploadReportOpen, setUploadReportOpen] = useState(false);
  const [skuGraphicsReportOpen, setSkuGraphicsReportOpen] = useState(false);
  const [isBuildingSkuGraphicsReport, setIsBuildingSkuGraphicsReport] = useState(false);
  const [skuGraphicsReportRows, setSkuGraphicsReportRows] = useState<
    Array<{
      sku: string;
      productName: string;
      availableCount: number;
      inPlaceCount: number;
      missingInPlaceCount: number;
      sampleAvailable: string[];
    }>
  >([]);
  const [skuGraphicsReportSummary, setSkuGraphicsReportSummary] = useState('');
  const [remoteMaxEntries, setRemoteMaxEntries] = useState(12000);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState('');
  const [remoteSummary, setRemoteSummary] = useState('');
  const [remoteEntries, setRemoteEntries] = useState<Array<{ type: 'dir' | 'file'; path: string; size: number; modifiedAt: string }>>([]);
  const [remoteSearchTerm, setRemoteSearchTerm] = useState('');
  const [remoteSortBy, setRemoteSortBy] = useState<'filename' | 'size' | 'modifiedAt'>('filename');
  const [remoteSortDir, setRemoteSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRemoteFiles, setSelectedRemoteFiles] = useState<string[]>([]);
  const [isDeletingRemoteFiles, setIsDeletingRemoteFiles] = useState(false);
  const [deleteSummary, setDeleteSummary] = useState('');
  const [uploadSettings] = useState(() => adminSettingsService.get());
  const uploadRegister = useMemo(() => imageAssetService.getUploadRegister(), [lastImportSummary]);

  useEffect(() => {
    void imageAssetService.syncUploadRegisterFromRemote().then(() => {
      setLastImportSummary((previous) => previous);
    });
  }, []);

  const uploadRegisterSummary = useMemo(() => {
    const totalBatches = uploadRegister.length;
    const totalFiles = uploadRegister.reduce((sum, entry) => sum + entry.fileCount, 0);
    const allRefs = uploadRegister.flatMap((entry) => entry.references);
    const uniqueRefs = new Set(allRefs.map((ref) => ref.trim().toLowerCase()).filter(Boolean));
    let currentlyResolvable = 0;
    uniqueRefs.forEach((ref) => {
      if (imageAssetService.isReferenceStored(ref)) {
        currentlyResolvable += 1;
      }
    });

    return {
      totalBatches,
      totalFiles,
      uniqueReferences: uniqueRefs.size,
      currentlyResolvable,
      unresolved: Math.max(0, uniqueRefs.size - currentlyResolvable),
    };
  }, [uploadRegister]);

  const visibleRemoteEntries = useMemo(() => {
    const term = remoteSearchTerm.trim().toLowerCase();
    const filtered = remoteEntries.filter((entry) => {
      if (entry.type !== 'file') return false;
      const fileName = entry.path.split('/').pop() ?? entry.path;
      return term ? fileName.toLowerCase().includes(term) : true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aFileName = a.path.split('/').pop() ?? a.path;
      const bFileName = b.path.split('/').pop() ?? b.path;
      let cmp = 0;
      if (remoteSortBy === 'size') cmp = a.size - b.size;
      else if (remoteSortBy === 'modifiedAt') cmp = Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt);
      else cmp = aFileName.localeCompare(bFileName);
      return remoteSortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [remoteEntries, remoteSearchTerm, remoteSortBy, remoteSortDir]);

  const setRemoteSort = (column: 'filename' | 'size' | 'modifiedAt') => {
    if (remoteSortBy === column) {
      setRemoteSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setRemoteSortBy(column);
    setRemoteSortDir(column === 'filename' ? 'asc' : 'desc');
  };

  const imageOnlyFiles = imageFiles.filter(isImageFile);
  const nonImageCount = imageFiles.length - imageOnlyFiles.length;
  const parsedPreview = useMemo(() => imageOnlyFiles.map((file) => ({ file, parsed: parseFilenameMeta(file.name) })), [imageOnlyFiles]);
  const invalidParsed = parsedPreview.filter((item) => !item.parsed.isValid);

  const selectedSkus = new Set(
    [...imageOnlyFiles]
      .map((file) => getSkuFromFilename(file.name).trim().toLowerCase())
      .filter(Boolean),
  );

  const onImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageFiles(files);
    setCheckPassed(false);
    setCheckedAssets([]);
    if (files.length > 0) {
      setMessage(`${files.length} file(s) selected.`);
    }
  };

  const onCheckImport = async () => {
    if (imageOnlyFiles.length === 0) {
      setMessage('Please select product image files first.');
      return;
    }

    if (invalidParsed.length > 0) {
      setValidationModalOpen(true);
      setCheckPassed(false);
      setMessage(`Check failed: ${invalidParsed.length} filename(s) need fixing before upload.`);
      return;
    }

    const existingProducts = await productService.list({ brand: 'piaa' });
    const assets: Array<{ file: File; reference: string }> = [];
    for (const item of parsedPreview) {
      const relative = (item.file as File & { webkitRelativePath?: string }).webkitRelativePath || item.file.name;
      const cleanRelative = relative.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = cleanRelative.split('/').filter(Boolean);
      const filename = parts[parts.length - 1] || item.file.name;
      assets.push({ file: item.file, reference: `${GRAPHICS_REFERENCE_FOLDER}/${filename}` });
    }

    setCheckedAssets(assets);
    setCheckedProductsCount(existingProducts.length);
    setCheckPassed(true);
    setMessage(`Check complete: ${assets.length} image(s) ready. Upload Now is enabled.`);
  };

  const onUploadNow = async () => {
    if (!checkPassed || checkedAssets.length === 0) {
      setMessage('Run Check Product Import first.');
      return;
    }

    setIsSaving(true);
    setAuditSummary('');
    setLastImportSummary('');
    setProgressLines([]);
    setProgressCurrent(0);
    setProgressTotal(0);

    try {
      const folderProducts: Product[] = [];
      const folderAssets = checkedAssets;
      const existingProducts = await productService.list({ brand: 'piaa' });

      const addProgress = (line: string) => {
        setProgressLines((previous) => {
          const next = [...previous, line];
          return next.slice(-12);
        });
      };

      const uploadGraphicsToServer = async () => {
        if (folderAssets.length === 0) {
          return;
        }

        const CHUNK_SIZE = 20;

        const candidateBases = Array.from(
          new Set([
            API_BASE,
            API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
            API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
          ]),
        );

        const chunks: Array<typeof folderAssets> = [];
        for (let i = 0; i < folderAssets.length; i += CHUNK_SIZE) {
          chunks.push(folderAssets.slice(i, i + CHUNK_SIZE));
        }

        let totalUploaded = 0;
        let totalSkipped = 0;
        let totalFailed = 0;
        let serverLimitInfo = '';

        for (let i = 0; i < chunks.length; i += 1) {
          const chunk = chunks[i] ?? [];
          addProgress(`Server upload chunk ${i + 1}/${chunks.length} (${chunk.length} file(s))...`);

          const form = new FormData();
          form.append('root', GRAPHICS_REMOTE_FOLDER);
          form.append('replace', replaceExistingGraphics ? 'true' : 'false');
          chunk.forEach((item) => {
            form.append('files[]', item.file, item.file.name);
          });

          let responseData: any = null;
          let lastError = '';
          for (const base of candidateBases) {
            const url = `${base}/files_upload.php`;
            try {
              const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: form,
              });
              const raw = await res.text();
              const parsed = JSON.parse(raw);
              if (!res.ok || !parsed?.ok) {
                lastError = parsed?.error ?? `Upload failed (${res.status})`;
                continue;
              }
              responseData = parsed;
              break;
            } catch (error) {
              lastError = error instanceof Error ? error.message : `Upload failed at ${url}`;
            }
          }

          if (!responseData) {
            throw new Error(lastError || 'Server graphics upload failed.');
          }

          const receivedCount = Number(responseData.receivedCount ?? chunk.length);
          if (receivedCount < chunk.length) {
            throw new Error(
              `Server accepted only ${receivedCount}/${chunk.length} files in a chunk. ` +
                `PHP limits: max_file_uploads=${responseData.phpMaxFileUploads ?? 'n/a'}, ` +
                `upload_max_filesize=${responseData.phpUploadMaxFilesize ?? 'n/a'}, post_max_size=${responseData.phpPostMaxSize ?? 'n/a'}.`,
            );
          }

          totalUploaded += Number(responseData.uploadedCount ?? 0);
          totalSkipped += Number(responseData.skippedCount ?? 0);
          totalFailed += Number(responseData.failedCount ?? 0);
          serverLimitInfo = `max_file_uploads=${responseData.phpMaxFileUploads ?? 'n/a'}, upload_max_filesize=${responseData.phpUploadMaxFilesize ?? 'n/a'}, post_max_size=${responseData.phpPostMaxSize ?? 'n/a'}`;
        }

        if (totalFailed > 0) {
          throw new Error(`Some files failed to upload to server (${totalFailed}).`);
        }

        addProgress(
          `Server upload summary: selected ${folderAssets.length}, uploaded ${totalUploaded}, skipped ${totalSkipped}, failed ${totalFailed}. ${serverLimitInfo}`,
        );
      };

      addProgress('Uploading source graphics to server folder /assets/graphics...');
      await uploadGraphicsToServer();
      addProgress('Server graphics upload complete.');

      const totalAssetFiles = folderAssets.length;
      if (totalAssetFiles > 0) {
        setProgressTotal(totalAssetFiles);
        addProgress(`Starting asset import for ${totalAssetFiles} file(s)...`);
      }

      const onProgress = (event: {
        index: number;
        total: number;
        fileName: string;
        stage: 'reading' | 'compressing' | 'storing' | 'done';
      }) => {
        const stageLabel: Record<typeof event.stage, string> = {
          reading: 'Reading',
          compressing: 'Compressing',
          storing: 'Storing',
          done: 'Done',
        };

        setProgressCurrent(Math.min(event.index, totalAssetFiles));
        addProgress(`${event.index}/${event.total} ${stageLabel[event.stage]}: ${event.fileName}`);
      };

      const imageAssetsBySku = new Map<string, Array<{ file: File; reference: string }>>();
      let matchedSkuCount = 0;
      const unmatchedSkus = new Set<string>();

      checkedAssets.forEach((item) => {
        const sku = getSkuFromFilename(item.file.name).toLowerCase();
        if (!sku) {
          return;
        }
        const list = imageAssetsBySku.get(sku) ?? [];
        list.push(item);
        imageAssetsBySku.set(sku, list);
      });

      if (folderAssets.length > 0) {
        const thumbnailCandidates = folderAssets.map((item) => {
          const parsed = parseFilenameMeta(item.file.name);
          return {
            file: item.file,
            reference: item.reference,
            sku: getSkuFromFilename(item.file.name),
            isMain: parsed.isMain,
          };
        });

        await imageAssetService.storePrimaryThumbnailsBySku(thumbnailCandidates, {
          maxImageSizeKb: uploadSettings.maxImageSizeKb,
          onProgress,
        });
      }

      const mergedBySku = new Map<string, Product>();
      const mergedByCompactSku = new Map<string, Product>();
      const addMerged = (product: Product) => {
        const exact = (product.sku || '').trim().toLowerCase();
        const compact = normalizeSkuTokenForMatch(product.sku);
        mergedBySku.set(exact, product);
        if (compact) {
          mergedByCompactSku.set(compact, product);
        }
      };

      existingProducts.forEach(addMerged);
      folderProducts.forEach(addMerged);

      imageAssetsBySku.forEach((assets, skuKey) => {
        const product = mergedBySku.get(skuKey) ?? mergedByCompactSku.get(normalizeSkuTokenForMatch(skuKey));
        if (!product) {
          unmatchedSkus.add(skuKey.toUpperCase());
          return;
        }
        matchedSkuCount += 1;

        const orderedReferences = sortImageReferencesForDisplay(assets.map((item) => item.reference));
        if (orderedReferences.length === 0) {
          return;
        }

        const primaryReference = orderedReferences[0];

        const existingGallery = replaceExistingGraphics ? [] : (product.galleryImageReferences ?? []);
        const dedupeByNormalizedReference = (references: string[]): string[] => {
          const seen = new Set<string>();
          const next: string[] = [];
          references.forEach((reference) => {
            const raw = String(reference || '').trim();
            if (!raw) {
              return;
            }
            const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
            if (seen.has(normalized)) {
              return;
            }
            seen.add(normalized);
            next.push(raw);
          });
          return next;
        };

        const gallery = dedupeByNormalizedReference([
          ...orderedReferences,
          ...existingGallery,
        ]);
        const existingPrimaryResolved = product.imageReference ? imageAssetService.resolveImage(product.imageReference) : null;
        const shouldReplacePrimary =
          replaceExistingGraphics ||
          !product.imageReference ||
          !existingPrimaryResolved ||
          String(existingPrimaryResolved).startsWith('/');

        const updatedProduct: Product = {
          ...product,
          imageReference: shouldReplacePrimary ? primaryReference : product.imageReference,
          galleryImageReferences: gallery,
          updatedAt: new Date().toISOString(),
        };
        mergedBySku.set(product.sku.trim().toLowerCase(), updatedProduct);
        mergedByCompactSku.set(normalizeSkuTokenForMatch(product.sku), updatedProduct);
      });

      // Safety pass: if a product still has no primary image, try to link from stored assets by SKU.
      const repairedFromStoredAssets: string[] = [];
      for (const [key, product] of mergedBySku.entries()) {
        if (product.imageReference) {
          continue;
        }

        const candidates = imageAssetService.findReferencesBySku(product.sku, product.category);
        if (candidates.length === 0) {
          continue;
        }

        const nextPrimary = candidates[0] ?? '';
        const nextGallery = Array.from(new Set([nextPrimary, ...(product.galleryImageReferences ?? [])].filter(Boolean)));
        mergedBySku.set(key, {
          ...product,
          imageReference: nextPrimary,
          galleryImageReferences: nextGallery,
          updatedAt: new Date().toISOString(),
        });
        repairedFromStoredAssets.push(product.sku);
      }

      const allProducts = Array.from(mergedBySku.values());
      addProgress(`Saving ${allProducts.length} product record(s)...`);
      await productService.upsertMany(allProducts);
      const unmatchedPreview = [...unmatchedSkus].slice(0, 8).join(', ');
      const importSummary =
        `Imported/updated ${allProducts.length} products. SKU matches: ${matchedSkuCount}/${imageAssetsBySku.size}. ` +
        `Fallback repaired from stored assets: ${repairedFromStoredAssets.length}.` +
        (unmatchedSkus.size > 0 ? ` Unmatched SKU sample: ${unmatchedPreview}` : '');
      setMessage(importSummary);
      const batchLine = ` Uploaded files this batch: ${folderAssets.length}.`; 
      setLastImportSummary(importSummary + batchLine);
      addProgress('Import complete.');
      setCheckPassed(false);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown upload error';
      const failure = `Upload failed before product save: ${details}`;
      setMessage(failure);
      setLastImportSummary(failure);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const onRepairMissingImages = async () => {
    setIsRepairingImages(true);
    setAuditSummary('');
    try {
      const existingProducts = await productService.list({ brand: 'piaa' });
      let repaired = 0;

      const updated = existingProducts.map((product) => {
        const resolvedPrimary = product.imageReference ? imageAssetService.resolveImage(product.imageReference) : null;
        const resolvedGallery = (product.galleryImageReferences ?? []).map((ref) => imageAssetService.resolveImage(ref)).filter(Boolean);
        const hasValidPrimary = Boolean(resolvedPrimary && !String(resolvedPrimary).startsWith('/'));
        const hasValidGallery = resolvedGallery.some((value) => !String(value).startsWith('/'));

        if (hasValidPrimary || hasValidGallery) {
          return product;
        }

        const candidates = imageAssetService.findReferencesBySku(product.sku, product.category);
        if (candidates.length === 0) {
          return product;
        }

        repaired += 1;
        const nextPrimary = candidates[0] ?? '';
        const nextGallery = Array.from(
          new Set([nextPrimary, ...(replaceExistingGraphics ? [] : (product.galleryImageReferences ?? []))].filter(Boolean)),
        );

        return {
          ...product,
          imageReference: nextPrimary,
          galleryImageReferences: nextGallery,
          updatedAt: new Date().toISOString(),
        };
      });

      await productService.upsertMany(updated);
      setMessage(
        repaired > 0
          ? `Image maintenance complete: repaired ${repaired} product(s) using SKU/category-matched asset references.`
          : 'Image maintenance complete: no missing/broken image references found to repair.',
      );
    } finally {
      setIsRepairingImages(false);
    }
  };

  const onAuditGraphicsCoverage = async () => {
    setIsAuditingImages(true);
    setMessage('Running graphics coverage audit...');
    try {
      const existingProducts = await productService.list({ brand: 'piaa' });
      const totals = {
        all: existingProducts.length,
        hasImageRef: 0,
        resolvedLocal: 0,
        resolvedPathOnly: 0,
        unresolved: 0,
        linkableBySku: 0,
        unresolvedAfterSkuCheck: 0,
      };

      const missingSamples: string[] = [];
      for (const product of existingProducts) {
        if (product.imageReference) {
          totals.hasImageRef += 1;
        }

        const resolved = product.imageReference ? imageAssetService.resolveImage(product.imageReference) : null;
        if (!resolved) {
          totals.unresolved += 1;
          const skuCandidates = imageAssetService.findReferencesBySku(product.sku, product.category);
          if (skuCandidates.length > 0) {
            totals.linkableBySku += 1;
          } else {
            totals.unresolvedAfterSkuCheck += 1;
            if (missingSamples.length < 8) {
              missingSamples.push(`${product.sku} | ${product.name}`);
            }
          }
          continue;
        }

        if (String(resolved).startsWith('/')) {
          totals.resolvedPathOnly += 1;
        } else {
          totals.resolvedLocal += 1;
        }
      }

      const sampleText = missingSamples.length > 0 ? ` Missing sample: ${missingSamples.join(' || ')}` : '';
      const summary =
        `Graphics audit: total ${totals.all}, refs ${totals.hasImageRef}, local-resolved ${totals.resolvedLocal}, ` +
        `path-only ${totals.resolvedPathOnly}, unresolved ${totals.unresolved}, ` +
        `linkable-by-sku ${totals.linkableBySku}, unresolved-after-sku-check ${totals.unresolvedAfterSkuCheck}.` +
        `${sampleText}`;
      setAuditSummary(summary);
      setMessage('Graphics coverage audit complete.');
    } finally {
      setIsAuditingImages(false);
    }
  };

  const onLinkGraphicsBySku = async () => {
    setIsLinkingImages(true);
    setAuditSummary('');
    try {
      const existingProducts = await productService.list({ brand: 'piaa' });
      let matched = 0;
      let updated = 0;
      let unmatched = 0;
      const matchedRows: LinkGraphicsDetailRow[] = [];
      const updatedRows: LinkGraphicsDetailRow[] = [];
      const unmatchedRows: Array<{ sku: string; productName: string }> = [];

      const nextProducts = existingProducts.map((product) => {
        let candidates = imageAssetService.findReferencesBySku(product.sku, product.category);
        let matchSource: 'sku' | 'text' = 'sku';
        if (candidates.length === 0) {
          candidates = imageAssetService.findReferencesByText(product.name, product.category);
          matchSource = 'text';
        }
        if (candidates.length === 0) {
          unmatched += 1;
          unmatchedRows.push({
            sku: product.sku || '-',
            productName: product.name,
          });
          return product;
        }

        matched += 1;
        const nextPrimary = candidates[0] ?? '';
        const nextGallery = Array.from(new Set([nextPrimary, ...(product.galleryImageReferences ?? [])].filter(Boolean)));
        const changed = product.imageReference !== nextPrimary;

        const row: LinkGraphicsDetailRow = {
          sku: product.sku || '-',
          productName: product.name,
          previousPrimary: product.imageReference || '-',
          nextPrimary: nextPrimary || '-',
          matchedReferences: candidates,
          matchSource,
        };
        matchedRows.push(row);
        if (changed) {
          updated += 1;
          updatedRows.push(row);
        }

        return {
          ...product,
          imageReference: nextPrimary,
          galleryImageReferences: nextGallery,
          updatedAt: changed ? new Date().toISOString() : product.updatedAt,
        };
      });

      await productService.upsertMany(nextProducts);
      setLinkGraphicsReport({
        matched: matchedRows,
        updated: updatedRows,
        unmatched: unmatchedRows,
      });
      setLinkGraphicsReportOpen(true);
      setMessage(
        `Graphics link complete: matched ${matched}, updated ${updated}, unmatched ${unmatched}. Run audit to confirm refs coverage.`,
      );
    } finally {
      setIsLinkingImages(false);
    }
  };

  const onRebuildUploadRegister = async () => {
    setIsRebuildingRegister(true);
    try {
      const existingProducts = await productService.list({ brand: 'piaa' });
      const refs = new Set<string>();
      let primaryRefCount = 0;
      let galleryRefCount = 0;
      existingProducts.forEach((product) => {
        if (product.imageReference) {
          primaryRefCount += 1;
          refs.add(product.imageReference);
        }
        (product.galleryImageReferences ?? []).forEach((ref) => {
          if (ref) {
            galleryRefCount += 1;
            refs.add(ref);
          }
        });
      });

      let storedRefsCount = 0;
      if (refs.size === 0) {
        const storedRefs = imageAssetService.listStoredReferences();
        storedRefsCount = storedRefs.length;
        storedRefs.forEach((ref) => refs.add(ref));
      }

      const result = imageAssetService.rebuildUploadRegisterFromReferences([...refs]);
      const info =
        result.createdEntries > 0
          ? `Upload register rebuilt: ${result.referencesTracked} reference(s) tracked from existing products.`
          : `Upload register rebuild skipped: no product references or stored asset references were found in this browser profile. Diagnostics => products: ${existingProducts.length}, primary refs: ${primaryRefCount}, gallery refs: ${galleryRefCount}, stored asset refs: ${storedRefsCount}. If you can see images elsewhere, that data is likely in a different browser/profile/domain.`;
      setMessage(info);
      setLastImportSummary(info);
    } finally {
      setIsRebuildingRegister(false);
    }
  };

  const onNormalizeOnlineGraphicsRefs = async () => {
    setIsNormalizingOnlineRefs(true);
    try {
      const products = await productService.list({ brand: 'piaa' });
      const requestedPath = encodeURIComponent(GRAPHICS_REMOTE_FOLDER);
      const res = await fetch(`${API_BASE}/files_manifest.php?path=${requestedPath}&max=20000&_ts=${Date.now()}`);
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Failed to load online graphics manifest');
      }

      const files: string[] = (Array.isArray(data.entries) ? data.entries : [])
        .filter((entry: any) => entry?.type === 'file')
        .map((entry: any) => String(entry.path || '').split('/').pop() || '')
        .filter(Boolean);

      const bySku = new Map<string, string[]>();
      files.forEach((filename) => {
        const sku = getSkuFromFilename(filename).toUpperCase();
        if (!sku) return;
        const list = bySku.get(sku) ?? [];
        list.push(filename);
        bySku.set(sku, list);
      });

      const targetSku = cleanupSku.trim().toUpperCase();
      const next = products.map((product) => {
        const sku = String(product.sku || '').trim().toUpperCase();
        if (!sku || (targetSku && sku !== targetSku)) {
          return product;
        }

        const matches = Array.from(new Set((bySku.get(sku) ?? []).map((file) => `${GRAPHICS_REFERENCE_FOLDER}/${file}`)));
        const curated = sortImageReferencesForDisplay(matches);
        if (curated.length === 0) {
          return product;
        }

        // Flush any locally cached aliases/data for this SKU's online refs so catalogue resolves fresh paths.
        curated.forEach((reference) => {
          imageAssetService.removeReference(reference);
          const fileName = reference.split('/').pop() ?? reference;
          imageAssetService.removeReference(fileName);
          imageAssetService.removeReference(removeExtension(fileName));
        });

        return {
          ...product,
          imageReference: curated[0],
          galleryImageReferences: curated,
          updatedAt: new Date().toISOString(),
        };
      });

      await productService.upsertMany(next);
      setMessage(targetSku
        ? `Online graphics refs normalized for ${targetSku}.`
        : 'Online graphics refs normalized for all PIAA products.');
    } finally {
      setIsNormalizingOnlineRefs(false);
    }
  };

  const onFlushGraphicsReferenceCache = async () => {
    setIsFlushingGraphicsCache(true);
    setFlushCacheReportRows([]);
    setFlushCacheReportSummary('');
    try {
      const products = await productService.list({ brand: 'piaa' });
      const targetSku = cleanupSku.trim().toUpperCase();
      const rows: Array<{ sku: string; productName: string; reference: string; flushedKeys: string[] }> = [];

      // Build online SKU->files map so we can immediately re-normalize refs after cache flush.
      const requestedPath = encodeURIComponent(GRAPHICS_REMOTE_FOLDER);
      const requestedMax = 20000;
      const candidateBases = Array.from(
        new Set([
          API_BASE,
          API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
          API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
        ]),
      );

      let manifestData: any = null;
      let lastManifestError = '';
      for (const base of candidateBases) {
        const url = `${base}/files_manifest.php?path=${requestedPath}&max=${requestedMax}&_ts=${Date.now()}`;
        try {
          const res = await fetch(url);
          const raw = await res.text();
          const parsed = JSON.parse(raw);
          if (!res.ok || !parsed?.ok) {
            lastManifestError = parsed?.error ?? `Manifest failed (${res.status})`;
            continue;
          }
          manifestData = parsed;
          break;
        } catch (error) {
          lastManifestError = error instanceof Error ? error.message : `Manifest load failed at ${url}`;
        }
      }

      if (!manifestData) {
        throw new Error(lastManifestError || 'Unable to load online graphics manifest for cache flush repair.');
      }

      const onlineFiles: string[] = (Array.isArray(manifestData.entries) ? manifestData.entries : [])
        .filter((entry: any) => entry?.type === 'file')
        .map((entry: any) => String(entry.path || '').split('/').pop() || '')
        .filter(Boolean);

      const availableBySku = new Map<string, string[]>();
      onlineFiles.forEach((filename) => {
        const sku = String(getSkuFromFilename(filename) || '').trim().toUpperCase();
        if (!sku) return;
        const list = availableBySku.get(sku) ?? [];
        list.push(filename);
        availableBySku.set(sku, list);
      });

      let repairedRefs = 0;
      let repairedProducts = 0;

      const nextProducts = products.map((product) => {
        const sku = String(product.sku || '').trim().toUpperCase();
        if (!sku || (targetSku && sku !== targetSku)) {
          return product;
        }

        const refs = Array.from(new Set([product.imageReference, ...(product.galleryImageReferences ?? [])].filter(Boolean)));
        refs.forEach((referenceRaw) => {
          const reference = String(referenceRaw);
          const fileName = reference.split('/').pop() ?? reference;
          const baseName = removeExtension(fileName);
          const keys = [reference, fileName, baseName].filter(Boolean);
          const flushedKeys: string[] = [];

          keys.forEach((key) => {
            if (imageAssetService.isReferenceStored(key)) {
              imageAssetService.removeReference(key);
              flushedKeys.push(key);
            }
          });

          if (flushedKeys.length > 0) {
            rows.push({
              sku,
              productName: product.name,
              reference,
              flushedKeys,
            });
          }
        });

        // Immediately normalize references back to online canonical graphics/* paths.
        const matches = Array.from(new Set((availableBySku.get(sku) ?? []).map((file) => `${GRAPHICS_REFERENCE_FOLDER}/${file}`)));
        const curated = sortImageReferencesForDisplay(matches);
        if (curated.length === 0) {
          return product;
        }

        const nextPrimary = curated[0] ?? product.imageReference;
        const changed =
          String(product.imageReference || '') !== String(nextPrimary || '') ||
          JSON.stringify(product.galleryImageReferences ?? []) !== JSON.stringify(curated);
        if (changed) {
          repairedProducts += 1;
        }
        repairedRefs += curated.length;

        return {
          ...product,
          imageReference: nextPrimary,
          galleryImageReferences: curated,
          updatedAt: changed ? new Date().toISOString() : product.updatedAt,
        };
      });

      await productService.upsertMany(nextProducts);

      setFlushCacheReportRows(rows);
      setFlushCacheReportSummary(
        targetSku
          ? `Cache flush complete for ${targetSku}: ${rows.length} reference(s) required flushing. Repaired ${repairedProducts} product(s), normalized ${repairedRefs} reference(s).`
          : `Cache flush complete for full range: ${rows.length} reference(s) required flushing. Repaired ${repairedProducts} product(s), normalized ${repairedRefs} reference(s).`,
      );
      setFlushCacheReportOpen(true);
      setMessage(
        targetSku
          ? `Flushed local graphics cache aliases + repaired online refs for ${targetSku}.`
          : 'Flushed local graphics cache aliases + repaired online refs for full PIAA range.',
      );
    } finally {
      setIsFlushingGraphicsCache(false);
    }
  };

  const onFetchRemoteManifest = async () => {
    setRemoteLoading(true);
    setRemoteError('');
    setRemoteSummary('');
    setDeleteSummary('');
    try {
      const requestedPath = encodeURIComponent(GRAPHICS_REMOTE_FOLDER);
      const requestedMax = Math.max(500, Math.min(20000, Number(remoteMaxEntries) || 4000));
      const candidateBases = Array.from(
        new Set([
          API_BASE,
          API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
          API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
        ]),
      );

      let data: any = null;
      let status = 0;
      let responseOk = false;
      let parseError = '';
      let matchedBase = '';

      for (const base of candidateBases) {
        const url = `${base}/files_manifest.php?path=${requestedPath}&max=${requestedMax}&_ts=${Date.now()}`;
        const res = await fetch(url);
        status = res.status;
        responseOk = res.ok;
        const raw = await res.text();
        try {
          const parsed = JSON.parse(raw);
          data = parsed;
          matchedBase = base;
          break;
        } catch {
          const snippet = raw.slice(0, 120).replace(/\s+/g, ' ').trim();
          parseError = `Non-JSON response from ${url} (starts with: "${snippet}")`;
        }
      }

      if (!data) {
        setRemoteEntries([]);
        setRemoteError(parseError || `Remote manifest failed (${status})`);
        return;
      }

      if (!responseOk || !data?.ok) {
        setRemoteEntries([]);
        setRemoteError(data?.error ?? `Remote manifest failed (${status})`);
        return;
      }
      const entries = Array.isArray(data.entries) ? data.entries : [];
      setRemoteEntries(entries);
      setSelectedRemoteFiles([]);
      setRemoteSummary(
        `API: ${matchedBase} | Root: ${data.root} | Folders: ${Number(data.directoryCount ?? 0)} | Files: ${Number(data.fileCount ?? 0)}${
          data.truncated ? ' | Truncated output (max entries reached)' : ''
        }`,
      );
    } catch (error) {
      setRemoteEntries([]);
      setRemoteError(error instanceof Error ? error.message : 'Failed to load remote manifest');
    } finally {
      setRemoteLoading(false);
    }
  };

  const onBuildSkuGraphicsStatusReport = async () => {
    setIsBuildingSkuGraphicsReport(true);
    setSkuGraphicsReportSummary('');
    try {
      const products = await productService.list({ brand: 'piaa' });
      const requestedPath = encodeURIComponent(GRAPHICS_REMOTE_FOLDER);
      const requestedMax = 20000;
      const candidateBases = Array.from(
        new Set([
          API_BASE,
          API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
          API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
        ]),
      );

      let manifestData: any = null;
      let lastError = '';
      for (const base of candidateBases) {
        const url = `${base}/files_manifest.php?path=${requestedPath}&max=${requestedMax}&_ts=${Date.now()}`;
        try {
          const res = await fetch(url);
          const raw = await res.text();
          const parsed = JSON.parse(raw);
          if (!res.ok || !parsed?.ok) {
            lastError = parsed?.error ?? `Manifest failed (${res.status})`;
            continue;
          }
          manifestData = parsed;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : `Manifest load failed at ${url}`;
        }
      }

      if (!manifestData) {
        throw new Error(lastError || 'Unable to load online graphics manifest for SKU report.');
      }

      const onlineFiles: string[] = (Array.isArray(manifestData.entries) ? manifestData.entries : [])
        .filter((entry: any) => entry?.type === 'file')
        .map((entry: any) => String(entry.path || '').split('/').pop() || '')
        .filter(Boolean);

      const availableBySku = new Map<string, string[]>();
      onlineFiles.forEach((filename) => {
        const sku = String(getSkuFromFilename(filename) || '').trim().toUpperCase();
        if (!sku) {
          return;
        }
        const list = availableBySku.get(sku) ?? [];
        list.push(filename);
        availableBySku.set(sku, list);
      });

      const rows = products
        .map((product) => {
          const sku = String(product.sku || '').trim().toUpperCase();
          const availableFiles = Array.from(new Set(availableBySku.get(sku) ?? []));
          const availableRefs = new Set(availableFiles.map((file) => `${GRAPHICS_REFERENCE_FOLDER}/${file}`.toLowerCase()));
          const assignedRefs = Array.from(new Set([product.imageReference, ...(product.galleryImageReferences ?? [])].filter(Boolean)));
          const inPlaceCount = assignedRefs.filter((ref) => availableRefs.has(String(ref).toLowerCase())).length;

          return {
            sku,
            productName: product.name,
            availableCount: availableFiles.length,
            inPlaceCount,
            missingInPlaceCount: Math.max(0, availableFiles.length - inPlaceCount),
            sampleAvailable: sortImageReferencesForDisplay(availableFiles).slice(0, 3),
          };
        })
        .sort((a, b) => {
          if (a.availableCount !== b.availableCount) {
            return a.availableCount - b.availableCount;
          }
          return a.sku.localeCompare(b.sku);
        });

      const zeroAvailableCount = rows.filter((row) => row.availableCount === 0).length;
      const totalSkus = rows.length;
      const totalAvailable = rows.reduce((sum, row) => sum + row.availableCount, 0);
      const totalInPlace = rows.reduce((sum, row) => sum + row.inPlaceCount, 0);

      setSkuGraphicsReportRows(rows);
      setSkuGraphicsReportSummary(
        `SKU report ready: ${totalSkus} SKU(s), available graphics ${totalAvailable}, in place ${totalInPlace}, zero available ${zeroAvailableCount}.`,
      );
      setSkuGraphicsReportOpen(true);
      setMessage('Report by SKU for graphics status generated.');
    } catch (error) {
      setSkuGraphicsReportRows([]);
      setSkuGraphicsReportSummary(error instanceof Error ? error.message : 'Failed to build SKU graphics status report.');
    } finally {
      setIsBuildingSkuGraphicsReport(false);
    }
  };

  const onAuditAndCleanBrokenImageRefs = async () => {
    setIsAuditingAndCleaningBrokenRefs(true);
    try {
      const products = await productService.list({ brand: 'piaa' });
      const requestedPath = encodeURIComponent(GRAPHICS_REMOTE_FOLDER);
      const requestedMax = 20000;
      const candidateBases = Array.from(
        new Set([
          API_BASE,
          API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
          API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
        ]),
      );

      let manifestData: any = null;
      let lastError = '';
      for (const base of candidateBases) {
        const url = `${base}/files_manifest.php?path=${requestedPath}&max=${requestedMax}&_ts=${Date.now()}`;
        try {
          const res = await fetch(url);
          const raw = await res.text();
          const parsed = JSON.parse(raw);
          if (!res.ok || !parsed?.ok) {
            lastError = parsed?.error ?? `Manifest failed (${res.status})`;
            continue;
          }
          manifestData = parsed;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : `Manifest load failed at ${url}`;
        }
      }

      if (!manifestData) {
        throw new Error(lastError || 'Unable to load online graphics manifest for audit/cleanup.');
      }

      const availableRefs = new Set(
        (Array.isArray(manifestData.entries) ? manifestData.entries : [])
          .filter((entry: any) => entry?.type === 'file')
          .map((entry: any) => String(entry.path || '').split('/').pop() || '')
          .filter(Boolean)
          .map((filename: string) => `${GRAPHICS_REFERENCE_FOLDER}/${filename}`.toLowerCase()),
      );

      let updatedProducts = 0;
      let removedRefs = 0;
      let fallbackAssigned = 0;

      const next = products.map((product) => {
        const refs = Array.from(new Set([product.imageReference, ...(product.galleryImageReferences ?? [])].filter(Boolean)));
        const cleaned = refs.filter((ref) => {
          const raw = String(ref || '').trim();
          if (!raw) return false;
          if (raw.startsWith('http://') || raw.startsWith('https://')) return true;
          if (raw === IMAGE_UNAVAILABLE_REFERENCE) return true;
          if (raw.startsWith('/images/')) return true;
          return availableRefs.has(raw.toLowerCase());
        });

        removedRefs += Math.max(0, refs.length - cleaned.length);

        const nextGallery = cleaned.length > 0 ? Array.from(new Set(cleaned)) : [IMAGE_UNAVAILABLE_REFERENCE];
        const nextPrimary = nextGallery[0] ?? IMAGE_UNAVAILABLE_REFERENCE;
        if (cleaned.length === 0) {
          fallbackAssigned += 1;
        }

        const changed =
          String(product.imageReference || '') !== String(nextPrimary || '') ||
          JSON.stringify(product.galleryImageReferences ?? []) !== JSON.stringify(nextGallery);
        if (!changed) {
          return product;
        }

        updatedProducts += 1;
        return {
          ...product,
          imageReference: nextPrimary,
          galleryImageReferences: nextGallery,
          updatedAt: new Date().toISOString(),
        };
      });

      await productService.upsertMany(next);
      setMessage(
        `Catalogue image audit+cleanup complete: updated ${updatedProducts} product(s), removed ${removedRefs} broken reference(s), assigned fallback-only image on ${fallbackAssigned} product(s).`,
      );
    } finally {
      setIsAuditingAndCleaningBrokenRefs(false);
    }
  };

  const toggleRemoteFileSelection = (path: string, checked: boolean) => {
    setSelectedRemoteFiles((previous) => {
      if (checked) {
        return Array.from(new Set([...previous, path]));
      }
      return previous.filter((item) => item !== path);
    });
  };

  const selectAllRemoteFiles = () => {
    const files = remoteEntries.filter((entry) => entry.type === 'file').map((entry) => entry.path);
    setSelectedRemoteFiles(files);
  };

  const selectAllRemoteGraphicsFiles = () => {
    const files = remoteEntries
      .filter((entry) => entry.type === 'file' && isGraphicsFilePath(entry.path))
      .map((entry) => entry.path);
    setSelectedRemoteFiles(files);
  };

  const clearRemoteFileSelection = () => {
    setSelectedRemoteFiles([]);
  };

  const onDeleteSelectedRemoteFiles = async () => {
    if (selectedRemoteFiles.length === 0) {
      setDeleteSummary('No files selected for delete.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedRemoteFiles.length} selected file(s) from /${GRAPHICS_REMOTE_FOLDER}? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingRemoteFiles(true);
    setDeleteSummary('');
    try {
      const requestedRoot = GRAPHICS_REMOTE_FOLDER.replace(/^\/+/, '');
      const candidateBases = Array.from(
        new Set([
          API_BASE,
          API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
          API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
        ]),
      );

      let responseData: any = null;
      let lastError = '';
      for (const base of candidateBases) {
        const url = `${base}/files_delete.php`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ root: requestedRoot, files: selectedRemoteFiles }),
        });
        const raw = await res.text();
        try {
          const parsed = JSON.parse(raw);
          if (!res.ok || !parsed?.ok) {
            lastError = parsed?.error ?? `Delete failed (${res.status})`;
            continue;
          }
          responseData = parsed;
          break;
        } catch {
          lastError = `Delete endpoint returned non-JSON from ${url}`;
        }
      }

      if (!responseData) {
        setDeleteSummary(lastError || 'Delete request failed.');
        return;
      }

      const deletedCount = Number(responseData.deletedCount ?? 0);
      const failedCount = Number(responseData.failedCount ?? 0);
      const deletedPaths: string[] = Array.isArray(responseData.deleted)
        ? responseData.deleted.map((item: any) => String(item || '')).filter(Boolean)
        : [];

      if (deletedPaths.length > 0) {
        const deletedFileNames = new Set(
          deletedPaths.map((path) => String(path).split('/').pop()?.toLowerCase() ?? '').filter(Boolean),
        );
        const deletedRefs = new Set(
          [...deletedFileNames].map((fileName) => `${GRAPHICS_REFERENCE_FOLDER}/${fileName}`.toLowerCase()),
        );

        // Flush browser-stored aliases/data for deleted graphics to avoid stale previews.
        deletedRefs.forEach((ref) => {
          imageAssetService.removeReference(ref);
          imageAssetService.removeReference(ref.split('/').pop() ?? ref);
        });

        // Flush product metadata refs that still point at deleted files.
        const existingProducts = await productService.list({ brand: 'piaa' });
        const updatedProducts = existingProducts.map((product) => {
          const currentGallery = (product.galleryImageReferences ?? []).filter(Boolean);
          const nextGallery = currentGallery.filter((ref) => {
            const fileName = String(ref).split('/').pop()?.toLowerCase() ?? '';
            return !deletedFileNames.has(fileName) && !deletedRefs.has(String(ref).toLowerCase());
          });

          const primaryFileName = String(product.imageReference || '').split('/').pop()?.toLowerCase() ?? '';
          const isPrimaryDeleted = deletedFileNames.has(primaryFileName) || deletedRefs.has(String(product.imageReference || '').toLowerCase());
          const nextPrimary = isPrimaryDeleted ? (nextGallery[0] ?? '') : product.imageReference;

          if (
            nextPrimary === product.imageReference &&
            nextGallery.length === currentGallery.length
          ) {
            return product;
          }

          return {
            ...product,
            imageReference: nextPrimary,
            galleryImageReferences: nextGallery,
            updatedAt: new Date().toISOString(),
          };
        });

        await productService.upsertMany(updatedProducts);
      }

      setDeleteSummary(`Delete complete: deleted ${deletedCount}, failed ${failedCount}.`);
      await onFetchRemoteManifest();
    } catch (error) {
      setDeleteSummary(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setIsDeletingRemoteFiles(false);
    }
  };

  return (
    <AdminLayout title="Product Upload">
      <div className="space-y-6">
        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">Product Graphics Import + Maintenance</h2>
          <p className="text-sm text-gray-400 mb-4">
            Unified workflow: load product images, run check, upload, then run maintenance/report tools as needed. Expected filename format:
            <code> SKU Description - indicator</code>.
          </p>

          <input id="product-images" type="file" accept="image/*" multiple onChange={onImagesSelected} className="sr-only" />
          <label
            htmlFor="product-images"
            className="inline-flex items-center cursor-pointer rounded border border-motorsport-yellow bg-motorsport-yellow/10 px-4 py-2 text-sm font-semibold text-motorsport-yellow hover:bg-motorsport-yellow/20 transition-colors"
          >
            Choose files
          </label>
          <span className="ml-3 text-sm text-gray-400 align-middle">
            {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : 'No files selected'}
          </span>

          {checkedProductsCount === 0 && (
            <p className="text-sm text-amber-400 mt-3">No products uploaded yet.</p>
          )}

          <div className="mt-4 border border-gray-800 bg-black/30 p-4">
            <h3 className="text-lg font-heading font-bold mb-2">Import workflow (Check + Upload)</h3>
            <p className="text-sm text-gray-400 mb-3">
              Step 1: choose files and run check. Step 2: upload after check passes.
            </p>
            <p className="text-xs text-gray-300 mb-1">
              Pre-import review: {imageOnlyFiles.length} image file(s) selected, {selectedSkus.size} SKU(s) detected.
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Filename samples: {[...imageOnlyFiles].slice(0, 5).map((file) => file.name).join(' | ') || 'N/A'}
            </p>
            <label className="inline-flex items-center gap-2 text-xs text-gray-300 mb-3">
              <input
                type="checkbox"
                checked={replaceExistingGraphics}
                onChange={(event) => setReplaceExistingGraphics(event.target.checked)}
              />
              Replace old files for matched SKUs
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void onCheckImport()}
                disabled={imageOnlyFiles.length === 0 || isSaving}
                className="btn-primary disabled:opacity-50"
              >
                Check Product Import
              </button>
              <button
                onClick={() => void onUploadNow()}
                disabled={!checkPassed || isSaving}
                className="btn-secondary disabled:opacity-50"
              >
                {isSaving ? 'Uploading...' : 'Upload Now'}
              </button>
            </div>
          </div>

          <div className="mt-4 border border-gray-800 bg-black/20 p-3">
            <h3 className="text-lg font-heading font-bold mb-2">Uploaded register (history)</h3>
            <p className="text-xs text-gray-400 mb-2">
              Batches: {uploadRegisterSummary.totalBatches} | Files uploaded: {uploadRegisterSummary.totalFiles} | Unique refs:{' '}
              {uploadRegisterSummary.uniqueReferences} | Still present: {uploadRegisterSummary.currentlyResolvable} | Missing:{' '}
              {uploadRegisterSummary.unresolved}
            </p>
            {uploadRegister.length === 0 ? (
              <p className="text-xs text-amber-400">
                No historical upload register found in this browser profile yet. Existing files may have been uploaded in another
                browser/session or before register tracking was introduced.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-auto pr-1">
                {uploadRegister.slice(0, 8).map((entry) => {
                  const present = entry.references.filter((ref) => imageAssetService.isReferenceStored(ref)).length;
                  const missing = entry.references.length - present;
                  return (
                    <div key={entry.id} className="border border-gray-800 bg-black/20 p-2 text-xs">
                      <p className="text-gray-200">
                        {new Date(entry.uploadedAt).toLocaleString()} — {entry.fileCount} file(s)
                      </p>
                      <p className="text-gray-500">Still present: {present} | Missing: {missing}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 border border-gray-800 bg-black/20 p-3">
            <h3 className="text-lg font-heading font-bold mb-2">Online folders/files manifest</h3>
            <p className="text-xs text-gray-400 mb-3">
              Reads server-side folder/file list from remote API for the graphics folder used by product categories.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="bg-black border border-gray-700 px-3 py-2 text-xs min-w-[260px] text-gray-200">
                Files in public_html/assets/graphics
              </div>
              <input
                type="number"
                min={500}
                max={20000}
                value={remoteMaxEntries}
                onChange={(event) => setRemoteMaxEntries(Number(event.target.value || 4000))}
                className="bg-black border border-gray-700 px-3 py-2 text-xs w-28"
                title="Max entries"
              />
              <button type="button" onClick={() => void onFetchRemoteManifest()} className="btn-secondary" disabled={remoteLoading}>
                {remoteLoading ? 'Loading...' : 'Check Online Files'}
              </button>
              <input
                type="text"
                value={remoteSearchTerm}
                onChange={(event) => setRemoteSearchTerm(event.target.value)}
                placeholder="Search file name..."
                className="bg-black border border-gray-700 px-3 py-2 text-xs min-w-[220px]"
              />
            </div>
            {remoteSummary && <p className="text-xs text-gray-300 mb-2">{remoteSummary}</p>}
            {remoteError && <p className="text-xs text-amber-400 mb-2">Error: {remoteError}</p>}
            {deleteSummary && <p className="text-xs text-motorsport-yellow mb-2">{deleteSummary}</p>}
            {remoteEntries.some((entry) => entry.type === 'file') && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button type="button" className="btn-secondary" onClick={selectAllRemoteFiles}>
                  Select all files
                </button>
                <button type="button" className="btn-secondary" onClick={selectAllRemoteGraphicsFiles}>
                  Select all graphics files
                </button>
                <button type="button" className="btn-secondary" onClick={clearRemoteFileSelection}>
                  Clear selection
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={selectedRemoteFiles.length === 0 || isDeletingRemoteFiles}
                  onClick={() => void onDeleteSelectedRemoteFiles()}
                >
                  {isDeletingRemoteFiles ? 'Deleting...' : `Delete selected (${selectedRemoteFiles.length})`}
                </button>
              </div>
            )}
            <p className="text-[11px] text-gray-500 mb-2">
              Workflow: 1) Check Online Files 2) Select affected files 3) Delete selected 4) Choose corrected source folder and re-upload.
            </p>
            {visibleRemoteEntries.length > 0 && (
              <div className="max-h-44 overflow-auto border border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-2 py-1 border-b border-gray-800">Select</th>
                      <th className="px-2 py-1 border-b border-gray-800">Type</th>
                      <th className="px-2 py-1 border-b border-gray-800 cursor-pointer" onClick={() => setRemoteSort('filename')}>
                        File name {remoteSortBy === 'filename' ? (remoteSortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="px-2 py-1 border-b border-gray-800 cursor-pointer" onClick={() => setRemoteSort('size')}>
                        Size {remoteSortBy === 'size' ? (remoteSortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="px-2 py-1 border-b border-gray-800 cursor-pointer" onClick={() => setRemoteSort('modifiedAt')}>
                        Modified {remoteSortBy === 'modifiedAt' ? (remoteSortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRemoteEntries.slice(0, 1000).map((entry, index) => (
                      <tr key={`${entry.path}-${index}`} className="odd:bg-black/20">
                        <td className="px-2 py-1 border-b border-gray-900">
                          {entry.type === 'file' ? (
                            <input
                              type="checkbox"
                              checked={selectedRemoteFiles.includes(entry.path)}
                              onChange={(event) => toggleRemoteFileSelection(entry.path, event.target.checked)}
                            />
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-2 py-1 border-b border-gray-900">{entry.type}</td>
                        <td className="px-2 py-1 border-b border-gray-900 text-gray-300">{entry.path.split('/').pop() ?? entry.path}</td>
                        <td className="px-2 py-1 border-b border-gray-900">{entry.size}</td>
                        <td className="px-2 py-1 border-b border-gray-900">{entry.modifiedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 border border-gray-800 bg-black/20 p-3">
            <h3 className="text-lg font-heading font-bold mb-2">Filename sanity preview (first 10)</h3>
            <p className="text-xs text-gray-400 mb-3">This will load with file names to check appropriate layout needed for imput file</p>
            {parsedPreview.length === 0 ? (
              <p className="text-xs text-gray-400">No files loaded yet.</p>
            ) : (
              <div className="space-y-2">
                {parsedPreview.slice(0, 10).sort((a, b) => Number(b.parsed.isMain) - Number(a.parsed.isMain)).map((item, idx) => (
                  <div key={`${item.file.name}-${idx}`} className="grid grid-cols-[1.2fr_2fr_1fr_72px] gap-2 items-center text-xs border-b border-gray-800 pb-1">
                    <span className="text-gray-200">{item.parsed.sku || 'N/A'}</span>
                    <span className="text-gray-400">{item.parsed.description || item.file.name}</span>
                    <span className="text-gray-500">{item.parsed.indicator || '-'}</span>
                    <img src={URL.createObjectURL(item.file)} alt={item.file.name} className="w-14 h-10 object-cover border border-gray-700" />
                  </div>
                ))}
              </div>
            )}
            {nonImageCount > 0 && <p className="text-xs text-amber-400 mt-2">Ignored non-image files: {nonImageCount}</p>}
          </div>

          <div className="mt-4 border-t border-gray-800 pt-4">
          {imageOnlyFiles.length === 0 && !isSaving && (
            <p className="text-xs text-gray-500 mt-2">
              To enable import, choose product image files first.
            </p>
          )}
          {message && <p className="text-sm text-gray-300 mt-3">{message}</p>}
          {lastImportSummary && (
            <div className="mt-3 border border-motorsport-yellow/40 bg-motorsport-yellow/5 p-3">
              <p className="text-xs text-motorsport-yellow whitespace-pre-wrap">{lastImportSummary}</p>
            </div>
          )}

          {(isSaving || progressLines.length > 0) && (
            <div className="mt-4 border border-gray-800 bg-black/40 p-3">
              <p className="text-sm text-gray-300 mb-2">
                Import progress: {progressCurrent}/{progressTotal || progressCurrent || 0}
              </p>
              <div className="space-y-1 max-h-40 overflow-auto pr-1">
                {progressLines.map((line, index) => (
                  <p key={`${line}-${index}`} className="text-xs text-gray-400">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
          <h3 className="text-lg font-heading font-bold mb-3">Maintenance + Repair + Reporting</h3>
          <p className="text-sm text-gray-400 mb-4">
            Use this to repair missing/broken product image links from already uploaded graphics, matched by SKU with
            category-aware ranking.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onLinkGraphicsBySku()}
                disabled={isLinkingImages}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isLinkingImages ? 'Linking...' : 'Link Graphics by SKU'}
              </button>
              <p className="text-xs text-gray-400">Matches products to available graphics by SKU and updates product image links.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onAuditGraphicsCoverage()}
                disabled={isAuditingImages}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isAuditingImages ? 'Auditing...' : 'Audit Graphics Coverage'}
              </button>
              <p className="text-xs text-gray-400">Checks how many product image references are valid, missing, or repairable.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onRepairMissingImages()}
                disabled={isRepairingImages}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isRepairingImages ? 'Repairing Graphics...' : 'Run Graphics Repair'}
              </button>
              <p className="text-xs text-gray-400">Repairs products with broken/missing graphics using best SKU/category matches.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onRebuildUploadRegister()}
                disabled={isRebuildingRegister}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isRebuildingRegister ? 'Rebuilding Register...' : 'Rebuild Upload Register'}
              </button>
              <p className="text-xs text-gray-400">Backfills upload history from current product references for diagnostic tracking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button type="button" onClick={() => setUploadReportOpen(true)} className="btn-secondary w-full">
                Upload Register Diagnostics
              </button>
              <p className="text-xs text-gray-400">Developer/support diagnostics for local upload-reference resolution status.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onNormalizeOnlineGraphicsRefs()}
                disabled={isNormalizingOnlineRefs}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isNormalizingOnlineRefs ? 'Normalizing...' : 'Normalize refs from online files'}
              </button>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Normalizes product image references to match files currently online for a SKU or all SKUs.</p>
                <input
                  type="text"
                  value={cleanupSku}
                  onChange={(event) => setCleanupSku(event.target.value)}
                  placeholder="Optional SKU (e.g. DKCL209)"
                  className="bg-black border border-gray-700 px-2 py-1 text-xs w-full lg:max-w-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onFlushGraphicsReferenceCache()}
                disabled={isFlushingGraphicsCache}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isFlushingGraphicsCache ? 'Flushing Cache...' : 'Flush Graphics Cache Aliases'}
              </button>
              <p className="text-xs text-gray-400">
                Maintenance repair action: clears stale local reference aliases for a specific SKU (if entered) or the full range, and provides a report of items that required flushing.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onBuildSkuGraphicsStatusReport()}
                disabled={isBuildingSkuGraphicsReport}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isBuildingSkuGraphicsReport ? 'Building Report...' : 'Report by SKU for Graphics status'}
              </button>
              <p className="text-xs text-gray-400">Business-facing report showing graphics available and in place per SKU, with zero-available highlighting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 items-start">
              <button
                type="button"
                onClick={() => void onAuditAndCleanBrokenImageRefs()}
                disabled={isAuditingAndCleaningBrokenRefs}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {isAuditingAndCleaningBrokenRefs ? 'Auditing + Cleaning...' : 'Audit + Clean Broken Image Refs'}
              </button>
              <p className="text-xs text-gray-400">Scans all PIAA products against current online graphics files, removes dead references, and keeps one fallback image when no real graphics exist (fixes duplicate empty placeholders like SSR56).</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Run <strong>Audit Graphics Coverage</strong> first, then <strong>Run Graphics Repair</strong>, then audit again.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            If legacy uploads predate register tracking, run <strong>Rebuild Upload Register</strong> to backfill history from
            existing product image references.
          </p>
          {auditSummary && (
            <div className="mt-3 border border-motorsport-yellow/40 bg-motorsport-yellow/5 p-3">
              <p className="text-xs text-motorsport-yellow whitespace-pre-wrap">{auditSummary}</p>
            </div>
          )}
          </div>
        </div>

        {validationModalOpen && invalidParsed.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Filename Validation Alerts</h3>
              <p className="text-sm text-gray-400 mb-3">
                These files do not meet required naming format. Fix them before upload.
              </p>
              <div className="max-h-[60vh] overflow-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-3 py-2 border-b border-gray-800">Filename</th>
                      <th className="px-3 py-2 border-b border-gray-800">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidParsed.slice(0, 50).map((item, idx) => (
                      <tr key={`${item.file.name}-${idx}`} className="odd:bg-black/20">
                        <td className="px-3 py-2 border-b border-gray-900">{item.file.name}</td>
                        <td className="px-3 py-2 border-b border-gray-900">{item.parsed.reason ?? 'Invalid format'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setValidationModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadReportOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Upload Register Diagnostics</h3>
              <div className="mb-3 border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                Diagnostic view for developers/support. This compares historical upload references against what is currently
                resolvable in this browser profile/local storage context. It is not a direct server-side inventory report.
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Historical record of upload batches captured in this browser. Includes whether references are still stored and
                resolvable locally.
              </p>
              <div className="mb-3 border border-gray-800 bg-black/20 p-3 text-xs text-gray-300">
                <p>Total batches: {uploadRegisterSummary.totalBatches}</p>
                <p>Total files uploaded: {uploadRegisterSummary.totalFiles}</p>
                <p>Unique references: {uploadRegisterSummary.uniqueReferences}</p>
                <p>Still present in local/browser storage: {uploadRegisterSummary.currentlyResolvable}</p>
                <p>Missing from local/browser storage: {uploadRegisterSummary.unresolved}</p>
              </div>
              <div className="max-h-[56vh] overflow-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-3 py-2 border-b border-gray-800">Uploaded at</th>
                      <th className="px-3 py-2 border-b border-gray-800">Files</th>
                      <th className="px-3 py-2 border-b border-gray-800">Still present</th>
                      <th className="px-3 py-2 border-b border-gray-800">Missing</th>
                      <th className="px-3 py-2 border-b border-gray-800">Sample references</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadRegister.map((entry) => {
                      const present = entry.references.filter((ref) => imageAssetService.isReferenceStored(ref)).length;
                      const missing = entry.references.length - present;
                      return (
                        <tr key={entry.id} className="odd:bg-black/20 align-top">
                          <td className="px-3 py-2 border-b border-gray-900">{new Date(entry.uploadedAt).toLocaleString()}</td>
                          <td className="px-3 py-2 border-b border-gray-900">{entry.fileCount}</td>
                          <td className="px-3 py-2 border-b border-gray-900 text-emerald-400">{present}</td>
                          <td className="px-3 py-2 border-b border-gray-900 text-amber-400">{missing}</td>
                          <td className="px-3 py-2 border-b border-gray-900 text-xs text-gray-500">
                            {entry.references.slice(0, 3).join(' | ') || '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {uploadRegister.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-xs text-amber-400">
                          No upload history has been recorded yet for this browser profile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setUploadReportOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {linkGraphicsReportOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-7xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Link Graphics by SKU - Detailed Report</h3>
              <p className="text-sm text-gray-400 mb-3">
                Full operation details for matched, updated, and unmatched products. If updated is 0 on a later run, it usually means references are already aligned from the previous run.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="border border-gray-800 bg-black/20 p-3 text-sm">
                  <p className="text-gray-400">Matched</p>
                  <p className="text-emerald-300 font-semibold text-lg">{linkGraphicsReport.matched.length}</p>
                </div>
                <div className="border border-gray-800 bg-black/20 p-3 text-sm">
                  <p className="text-gray-400">Updated</p>
                  <p className="text-motorsport-yellow font-semibold text-lg">{linkGraphicsReport.updated.length}</p>
                </div>
                <div className="border border-gray-800 bg-black/20 p-3 text-sm">
                  <p className="text-gray-400">Unmatched</p>
                  <p className="text-red-300 font-semibold text-lg">{linkGraphicsReport.unmatched.length}</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[58vh] overflow-auto pr-1">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300 mb-2">Matched products</h4>
                  <div className="border border-gray-800 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-black sticky top-0">
                        <tr className="text-left text-gray-300">
                          <th className="px-2 py-2 border-b border-gray-800">SKU</th>
                          <th className="px-2 py-2 border-b border-gray-800">Product</th>
                          <th className="px-2 py-2 border-b border-gray-800">Source</th>
                          <th className="px-2 py-2 border-b border-gray-800">Previous primary</th>
                          <th className="px-2 py-2 border-b border-gray-800">Next primary</th>
                          <th className="px-2 py-2 border-b border-gray-800">Matched refs / files</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkGraphicsReport.matched.map((row, idx) => (
                          <tr key={`${row.sku}-${row.productName}-m-${idx}`} className="odd:bg-black/20 align-top">
                            <td className="px-2 py-2 border-b border-gray-900">{row.sku}</td>
                            <td className="px-2 py-2 border-b border-gray-900">{row.productName}</td>
                            <td className="px-2 py-2 border-b border-gray-900">{row.matchSource}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-gray-400">{row.previousPrimary}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-emerald-300">{row.nextPrimary}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-gray-500">{row.matchedReferences.join(' | ') || '-'}</td>
                          </tr>
                        ))}
                        {linkGraphicsReport.matched.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-2 py-3 text-amber-400">No matched products in this run.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-motorsport-yellow mb-2">Updated products</h4>
                  <div className="border border-gray-800 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-black sticky top-0">
                        <tr className="text-left text-gray-300">
                          <th className="px-2 py-2 border-b border-gray-800">SKU</th>
                          <th className="px-2 py-2 border-b border-gray-800">Product</th>
                          <th className="px-2 py-2 border-b border-gray-800">Previous primary</th>
                          <th className="px-2 py-2 border-b border-gray-800">New primary</th>
                          <th className="px-2 py-2 border-b border-gray-800">Matched refs / files</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkGraphicsReport.updated.map((row, idx) => (
                          <tr key={`${row.sku}-${row.productName}-u-${idx}`} className="odd:bg-black/20 align-top">
                            <td className="px-2 py-2 border-b border-gray-900">{row.sku}</td>
                            <td className="px-2 py-2 border-b border-gray-900">{row.productName}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-gray-400">{row.previousPrimary}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-motorsport-yellow">{row.nextPrimary}</td>
                            <td className="px-2 py-2 border-b border-gray-900 text-gray-500">{row.matchedReferences.join(' | ') || '-'}</td>
                          </tr>
                        ))}
                        {linkGraphicsReport.updated.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-2 py-3 text-amber-400">
                              No products needed updating this run (likely already aligned from previous run).
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Unmatched products</h4>
                  <div className="border border-gray-800 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-black sticky top-0">
                        <tr className="text-left text-gray-300">
                          <th className="px-2 py-2 border-b border-gray-800">SKU</th>
                          <th className="px-2 py-2 border-b border-gray-800">Product</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkGraphicsReport.unmatched.map((row, idx) => (
                          <tr key={`${row.sku}-${row.productName}-n-${idx}`} className="odd:bg-black/20 align-top">
                            <td className="px-2 py-2 border-b border-gray-900">{row.sku}</td>
                            <td className="px-2 py-2 border-b border-gray-900">{row.productName}</td>
                          </tr>
                        ))}
                        {linkGraphicsReport.unmatched.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-2 py-3 text-emerald-300">No unmatched products in this run.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setLinkGraphicsReportOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {skuGraphicsReportOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Report by SKU for Graphics status</h3>
              <p className="text-sm text-gray-400 mb-3">
                Shows available online graphics and how many are already in place on each SKU product record.
              </p>
              {skuGraphicsReportSummary && (
                <div className="mb-3 border border-gray-800 bg-black/20 p-3 text-xs text-gray-300">
                  {skuGraphicsReportSummary}
                </div>
              )}
              <div className="max-h-[56vh] overflow-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-3 py-2 border-b border-gray-800">SKU</th>
                      <th className="px-3 py-2 border-b border-gray-800">Product</th>
                      <th className="px-3 py-2 border-b border-gray-800">Graphics available</th>
                      <th className="px-3 py-2 border-b border-gray-800">Graphics in place</th>
                      <th className="px-3 py-2 border-b border-gray-800">Missing from in place</th>
                      <th className="px-3 py-2 border-b border-gray-800">Sample available files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuGraphicsReportRows.map((row) => (
                      <tr
                        key={`${row.sku}-${row.productName}`}
                        className={`align-top ${row.availableCount === 0 ? 'bg-red-950/40' : 'odd:bg-black/20'}`}
                      >
                        <td className="px-3 py-2 border-b border-gray-900 font-semibold">{row.sku || '-'}</td>
                        <td className="px-3 py-2 border-b border-gray-900">{row.productName}</td>
                        <td className={`px-3 py-2 border-b border-gray-900 ${row.availableCount === 0 ? 'text-red-300 font-semibold' : 'text-emerald-300'}`}>
                          {row.availableCount}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-900 text-motorsport-yellow">{row.inPlaceCount}</td>
                        <td className="px-3 py-2 border-b border-gray-900 text-amber-300">{row.missingInPlaceCount}</td>
                        <td className="px-3 py-2 border-b border-gray-900 text-xs text-gray-500">
                          {row.sampleAvailable.join(' | ') || '-'}
                        </td>
                      </tr>
                    ))}
                    {skuGraphicsReportRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-3 text-xs text-amber-400">
                          No SKU graphics report rows available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setSkuGraphicsReportOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {flushCacheReportOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Graphics Cache Flush Report</h3>
              <p className="text-sm text-gray-400 mb-3">
                Shows product references where stale local aliases were found and flushed.
              </p>
              {flushCacheReportSummary && (
                <div className="mb-3 border border-gray-800 bg-black/20 p-3 text-xs text-gray-300">
                  {flushCacheReportSummary}
                </div>
              )}
              <div className="max-h-[56vh] overflow-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      <th className="px-3 py-2 border-b border-gray-800">SKU</th>
                      <th className="px-3 py-2 border-b border-gray-800">Product</th>
                      <th className="px-3 py-2 border-b border-gray-800">Reference</th>
                      <th className="px-3 py-2 border-b border-gray-800">Flushed alias keys</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flushCacheReportRows.map((row, idx) => (
                      <tr key={`${row.sku}-${row.reference}-${idx}`} className="odd:bg-black/20 align-top">
                        <td className="px-3 py-2 border-b border-gray-900 font-semibold">{row.sku}</td>
                        <td className="px-3 py-2 border-b border-gray-900">{row.productName}</td>
                        <td className="px-3 py-2 border-b border-gray-900 text-gray-300">{row.reference}</td>
                        <td className="px-3 py-2 border-b border-gray-900 text-xs text-motorsport-yellow">{row.flushedKeys.join(' | ')}</td>
                      </tr>
                    ))}
                    {flushCacheReportRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-3 text-xs text-emerald-300">
                          No stale local cache aliases were found that needed flushing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setFlushCacheReportOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductUploadPage;
