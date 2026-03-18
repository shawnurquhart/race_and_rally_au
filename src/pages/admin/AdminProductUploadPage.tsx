import React, { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { parseCsv } from '@/utils/csvImport';
import {
  buildProductsFromMappedRows,
  defaultMappingFromHeaders,
  PRODUCT_IMPORT_FIELDS,
  type ProductImportField,
  type ProductImportMapping,
} from '@/utils/productImport';
import { PIAA_CATEGORIES, type PiaaCategory, type Product } from '@/types/product';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import { adminSettingsService } from '@/services/adminSettingsService';

const fieldLabels: Record<ProductImportField, string> = {
  name: 'Product name',
  sku: 'SKU / Product code',
  description: 'Description',
  price: 'Price',
  imageReference: 'Image filename/reference',
};

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const normalizeCategoryFromName = (value: string): PiaaCategory | null => {
  const normalized = value.trim().toLowerCase();
  return PIAA_CATEGORIES.find((category) => category.toLowerCase() === normalized) ?? null;
};

const detectCategoryFromPathParts = (
  parts: string[],
): { category: PiaaCategory | null; categoryIndex: number } => {
  for (let index = 0; index < parts.length; index += 1) {
    const category = normalizeCategoryFromName(parts[index] ?? '');
    if (category) {
      return { category, categoryIndex: index };
    }
  }

  return { category: null, categoryIndex: -1 };
};

const removeExtension = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
};

const normalizeProductNameFromFilename = (filename: string): string =>
  removeExtension(filename)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasImageExtension = (filename: string): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'].includes(extension);
};

const isImageFile = (file: File): boolean => file.type.startsWith('image/') || hasImageExtension(file.name);

const AdminProductUploadPage: React.FC = () => {
  const [category, setCategory] = useState<PiaaCategory>('Lights');
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ProductImportMapping>({
    name: null,
    sku: null,
    description: null,
    price: null,
    imageReference: null,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>('');
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadSettings] = useState(() => adminSettingsService.get());

  const canImport = useMemo(() => rows.length > 0 && Boolean(mapping.name), [mapping.name, rows.length]);

  const onCsvSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCsvFileName('');
      return;
    }

    setCsvFileName(file.name);
    const content = await file.text();
    const parsed = parseCsv(content);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(defaultMappingFromHeaders(parsed.headers));
    setMessage(`CSV loaded: ${parsed.rows.length} rows found.`);
  };

  const onMappingChanged = (field: ProductImportField, value: string) => {
    setMapping((previous) => ({
      ...previous,
      [field]: value || null,
    }));
  };

  const onImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageFiles(files);
    if (files.length > 0) {
      setMessage(`${files.length} image file(s) selected for filename matching.`);
    }
  };

  const onFolderSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setFolderFiles(files);
    if (files.length > 0) {
      setMessage(`${files.length} file(s) selected from folder import.`);
    }
  };

  const onFolderImageFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setFolderFiles(files);
    if (files.length > 0) {
      setMessage(`${files.length} image file(s) selected for folder-style import.`);
    }
  };

  const buildProductsFromFolderFiles = (
    files: File[],
  ): { products: Product[]; assets: Array<{ file: File; reference: string }> } => {
    const now = new Date().toISOString();

    const assets: Array<{ file: File; reference: string }> = [];
    const products = files
      .filter(isImageFile)
      .map((file) => {
        const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const cleanRelative = relative.replace(/\\/g, '/').replace(/^\/+/, '');
        const parts = cleanRelative.split('/').filter(Boolean);

        const filename = parts[parts.length - 1] || file.name;
        const { category: pathCategory, categoryIndex } = detectCategoryFromPathParts(parts);
        const inferredCategory = pathCategory ?? category;

        const folderSegments =
          categoryIndex >= 0
            ? parts.slice(categoryIndex + 1, -1)
            : parts.length > 1
              ? parts.slice(0, -1)
              : [];
        const folderName = folderSegments.length > 0 ? folderSegments.join(' / ') : undefined;
        const referenceSegments = [inferredCategory, ...folderSegments, filename];
        const imageReference = referenceSegments.join('/');

        assets.push({ file, reference: imageReference });

        return {
          id: makeId(),
          brand: 'piaa' as const,
          category: inferredCategory,
          folderName,
          name: normalizeProductNameFromFilename(filename) || removeExtension(filename),
          sku: removeExtension(filename),
          description: 'Product description here...',
          price: null,
          imageReference,
          galleryImageReferences: [imageReference],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
      });

    return { products, assets };
  };

  const onImport = async () => {
    const hasCsvImport = rows.length > 0;
    const hasFolderImport = folderFiles.length > 0;

    if (!hasCsvImport && !hasFolderImport) {
      setMessage('Please upload a CSV and/or select a product image folder to import.');
      return;
    }

    if (hasCsvImport && !canImport) {
      setMessage('Please upload CSV and map at least Product name.');
      return;
    }

    setIsSaving(true);
    setProgressLines([]);
    setProgressCurrent(0);
    setProgressTotal(0);

    try {
      const csvProducts = hasCsvImport ? buildProductsFromMappedRows(rows, mapping, category) : [];
      const { products: folderProducts, assets: folderAssets } = hasFolderImport
        ? buildProductsFromFolderFiles(folderFiles)
        : { products: [], assets: [] };

      const addProgress = (line: string) => {
        setProgressLines((previous) => {
          const next = [...previous, line];
          return next.slice(-12);
        });
      };

      const totalAssetFiles = imageFiles.length + folderAssets.length;
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

      if (imageFiles.length > 0) {
        await imageAssetService.storeFiles(imageFiles, {
          maxImageSizeKb: uploadSettings.maxImageSizeKb,
          onProgress,
        });
      }

      if (folderAssets.length > 0) {
        await imageAssetService.storeFilesWithReferences(folderAssets, {
          maxImageSizeKb: uploadSettings.maxImageSizeKb,
          onProgress,
        });
      }

      const allProducts = [...csvProducts, ...folderProducts];
      addProgress(`Saving ${allProducts.length} product record(s)...`);
      await productService.upsertMany(allProducts);
      setMessage(`Imported ${allProducts.length} products (${csvProducts.length} CSV + ${folderProducts.length} folder).`);
      addProgress('Import complete.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Product Upload">
      <div className="space-y-6">
        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">1) Upload CSV</h2>
          <p className="text-sm text-gray-400 mb-4">
            First-stage importer targets brand <span className="text-motorsport-yellow">PIAA</span> and supports CSV.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="csv-file">
                CSV file
              </label>
              <input id="csv-file" type="file" accept=".csv,text/csv" onChange={(event) => void onCsvSelected(event)} className="sr-only" />
              <label
                htmlFor="csv-file"
                className="inline-flex items-center cursor-pointer rounded border border-motorsport-yellow bg-motorsport-yellow/10 px-4 py-2 text-sm font-semibold text-motorsport-yellow hover:bg-motorsport-yellow/20 transition-colors"
              >
                Choose file
              </label>
              <span className="ml-3 text-sm text-gray-400 align-middle">{csvFileName || 'No file selected'}</span>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="piaa-category">
                Assign category
              </label>
              <select
                id="piaa-category"
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={category}
                onChange={(event) => setCategory(event.target.value as PiaaCategory)}
              >
                {PIAA_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">2) Map CSV columns</h2>
          <p className="text-sm text-gray-400 mb-4">
            Map source columns to internal product fields. This structure is designed for additional brands later.
          </p>

          {headers.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-gray-700 p-3">
              Upload a CSV file in Step 1 to enable column mapping.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRODUCT_IMPORT_FIELDS.map((field) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-300 mb-1">{fieldLabels[field]}</label>
                    <select
                      className="w-full bg-black border border-gray-700 px-3 py-2"
                      value={mapping[field] ?? ''}
                      onChange={(event) => onMappingChanged(field, event.target.value)}
                    >
                      <option value="">-- Not mapped --</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4">Rows detected: {rows.length}</p>
            </>
          )}
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">3) Associate product images (development strategy)</h2>
          <p className="text-sm text-gray-400 mb-4">
            Upload image files and match by filename. The importer stores images locally and resolves both full filename
            (e.g. <code>lamp-001.jpg</code>) and base name (e.g. <code>lamp-001</code>) against CSV image references.
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
          <p className="text-xs text-gray-500 mt-2">
            Optional folder selection can be added later via File System Access API for supported browsers.
          </p>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">4) Import product photos from category folders</h2>
          <p className="text-sm text-gray-400 mb-4">
            Select a folder where top-level folder names match categories (<code>Lights</code>, <code>Globes</code>,
            <code>Other Products</code>). Product names are generated from filenames (underscores removed), with default
            placeholder description and price-on-request.
          </p>

          <input
            id="product-folder"
            type="file"
            multiple
            onChange={onFolderSelected}
            className="sr-only"
            {...({ webkitdirectory: 'true', directory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          <label
            htmlFor="product-folder"
            className="inline-flex items-center cursor-pointer rounded border border-motorsport-yellow bg-motorsport-yellow/10 px-4 py-2 text-sm font-semibold text-motorsport-yellow hover:bg-motorsport-yellow/20 transition-colors"
          >
            Choose folder
          </label>
          <input
            id="product-folder-files"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/*"
            onChange={onFolderImageFilesSelected}
            className="sr-only"
          />
          <label
            htmlFor="product-folder-files"
            className="ml-3 inline-flex items-center cursor-pointer rounded border border-gray-600 bg-gray-800/40 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800/70 transition-colors"
          >
            Choose files (alternative)
          </label>
          <span className="ml-3 text-sm text-gray-400 align-middle">
            {folderFiles.length > 0 ? `${folderFiles.length} file(s) in selected folder` : 'No folder selected'}
          </span>
          <p className="text-xs text-gray-500 mt-2">
            If your browser folder picker shows no files, use <strong>Choose files (alternative)</strong> inside the
            target folder and select all images. Images above {uploadSettings.maxImageSizeKb}KB are compressed on
            upload. Configure this in Admin Settings.
          </p>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <button
            onClick={() => void onImport()}
            disabled={(rows.length > 0 && !canImport) || (rows.length === 0 && folderFiles.length === 0) || isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Importing...' : 'Import Products'}
          </button>
          {message && <p className="text-sm text-gray-300 mt-3">{message}</p>}

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
      </div>
    </AdminLayout>
  );
};

export default AdminProductUploadPage;
