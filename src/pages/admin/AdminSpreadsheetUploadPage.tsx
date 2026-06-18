import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { parseCsv } from '@/utils/csvImport';
import { buildProductsFromSectionedSpreadsheetRows } from '@/utils/productImport';
import { productService } from '@/services/productService';
import type { Product } from '@/types/product';

interface ParsedTableData {
  headers: string[];
  rows: Record<string, string>[];
}

interface UploadAlertRules {
  maxSkuLength: number;
  minRetailPrice: number;
  requireSku: boolean;
  requireDescription: boolean;
  requirePrice: boolean;
}

interface ImportReportGroup {
  category: string;
  subCategory?: string;
  products: Product[];
}

const ALERT_RULES_STORAGE_KEY = 'rra_spreadsheet_alert_rules_v1';
const DEFAULT_ALERT_RULES: UploadAlertRules = {
  maxSkuLength: 8,
  minRetailPrice: 1,
  requireSku: true,
  requireDescription: true,
  requirePrice: true,
};

const REQUIRED_COLUMNS = [
  'Part Number',
  'Category and Product Description',
  'Number of Units Inc.',
  'Retail',
];

const readAlertRules = (): UploadAlertRules => {
  const raw = localStorage.getItem(ALERT_RULES_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_ALERT_RULES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UploadAlertRules>;
    return {
      maxSkuLength: Number(parsed.maxSkuLength ?? DEFAULT_ALERT_RULES.maxSkuLength),
      minRetailPrice: Number(parsed.minRetailPrice ?? DEFAULT_ALERT_RULES.minRetailPrice),
      requireSku: parsed.requireSku ?? DEFAULT_ALERT_RULES.requireSku,
      requireDescription: parsed.requireDescription ?? DEFAULT_ALERT_RULES.requireDescription,
      requirePrice: parsed.requirePrice ?? DEFAULT_ALERT_RULES.requirePrice,
    };
  } catch {
    return DEFAULT_ALERT_RULES;
  }
};

const writeAlertRules = (rules: UploadAlertRules): void => {
  localStorage.setItem(ALERT_RULES_STORAGE_KEY, JSON.stringify(rules));
};

const normalizeHeader = (value: string): string => value.trim().toLowerCase();

const looksLikeProductHeaderRow = (row: Array<string | number | boolean | null>): boolean => {
  const normalized = row.map((cell) => normalizeHeader(String(cell ?? ''))).filter(Boolean);
  const joined = normalized.join(' ');
  return joined.includes('part number') && joined.includes('retail');
};

const sanitizeHeaders = (headers: string[]): string[] => {
  const seen = new Map<string, number>();
  return headers.map((raw, index) => {
    const base = raw.trim() || `column_${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
};

const parseXlsxFile = async (file: File): Promise<ParsedTableData> => {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const targetSheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase().includes('wholesale')) ?? workbook.SheetNames[0];

  if (!targetSheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[targetSheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerIndex = Math.max(0, matrix.findIndex((row) => looksLikeProductHeaderRow(row)));
  const headers = sanitizeHeaders((matrix[headerIndex] ?? []).map((value) => String(value ?? '').trim()));
  const rows = matrix.slice(headerIndex + 1).map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = String(row[index] ?? '').trim();
      return record;
    }, {}),
  );

  return { headers, rows };
};

const parseSpreadsheetFile = async (file: File): Promise<ParsedTableData> => {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseXlsxFile(file);
  }

  const content = await file.text();
  return parseCsv(content);
};

const AdminSpreadsheetUploadPage: React.FC = () => {
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [pendingFileName, setPendingFileName] = useState('');
  const [pendingHeaders, setPendingHeaders] = useState<string[]>([]);
  const [pendingRows, setPendingRows] = useState<Record<string, string>[]>([]);
  const [message, setMessage] = useState('');
  const [importStatusLines, setImportStatusLines] = useState<string[]>([]);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionSummary, setCompletionSummary] = useState('');
  const [debugRows, setDebugRows] = useState<string[]>([]);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);
  const [importReportGroups, setImportReportGroups] = useState<ImportReportGroup[]>([]);
  const [pendingSkippedRows, setPendingSkippedRows] = useState(0);
  const [pendingUpdateCount, setPendingUpdateCount] = useState(0);
  const [pendingAddCount, setPendingAddCount] = useState(0);
  const [pendingSkuActionById, setPendingSkuActionById] = useState<Record<string, 'Update' | 'Add'>>({});
  const [alertRules, setAlertRules] = useState<UploadAlertRules>(() => readAlertRules());
  const [rowAlerts, setRowAlerts] = useState<
    Array<{ lineNumber: number; sku: string; description: string; price: number | null; reason: string }>
  >([]);

  const actionableAlerts = rowAlerts.filter((alert) => alert.sku || alert.description || alert.price !== null);
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const hasRequiredColumns = REQUIRED_COLUMNS.every((required) => normalizedHeaders.includes(normalizeHeader(required)));

  const addImportStatus = (line: string) => {
    setImportStatusLines((previous) => [...previous, line].slice(-10));
  };

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName('');
      setHeaders([]);
      setDebugRows([]);
      return;
    }

    const parsed = await parseSpreadsheetFile(file);
    setPendingFileName(file.name);
    setPendingHeaders(parsed.headers);
    setPendingRows(parsed.rows);
    setIsFilePreviewOpen(true);
  };

  const buildImportReportGroups = (products: Product[]): ImportReportGroup[] => {
    const grouped = new Map<string, ImportReportGroup>();

    for (const product of products) {
      const key = `${product.category}__${product.subCategory ?? ''}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          category: product.category,
          subCategory: product.subCategory,
          products: [product],
        });
      } else {
        existing.products.push(product);
      }
    }

    return Array.from(grouped.values());
  };

  const onConfirmFilePreview = async () => {
    setFileName(pendingFileName);
    setHeaders(pendingHeaders);
    setPendingFileName('');
    setPendingHeaders([]);
    setPendingRows([]);
    setDebugRows([]);
    setRowAlerts([]);
    setImportStatusLines([]);
    setMessage(`Loaded ${pendingRows.length} rows from spreadsheet. Starting import...`);
    setIsFilePreviewOpen(false);

    const importedHeaders = pendingHeaders;
    const importedRows = pendingRows;

    if (importedHeaders.length === 0 || importedRows.length === 0) {
      setMessage('No loaded spreadsheet data found. Choose a file and try again.');
      return;
    }

    const importedNormalizedHeaders = importedHeaders.map((header) => normalizeHeader(header));
    const importedHasRequiredColumns = REQUIRED_COLUMNS.every((required) =>
      importedNormalizedHeaders.includes(normalizeHeader(required)),
    );
    if (!importedHasRequiredColumns) {
      setMessage('Required columns not detected. Please check input file contains: Part Number | Category and Product Description | Number of Units Inc. | Retail');
      return;
    }

    setImportStatusLines([]);
    addImportStatus('Starting spreadsheet checks...');

    try {
      const { products, skippedRows, unmatchedSectionRows } = buildProductsFromSectionedSpreadsheetRows(importedRows, importedHeaders);
      addImportStatus(`Parsed ${products.length} product row(s), skipped ${skippedRows} row(s).`);
      setRowAlerts([]);
      setDebugRows(unmatchedSectionRows);
      setPendingSkippedRows(skippedRows);

      if (products.length === 0) {
        setDebugRows([]);
        setMessage('No importable products found from columns B/C/E. Please verify the spreadsheet format.');
        addImportStatus('No importable rows found.');
        return;
      }

      addImportStatus('Matching imported rows against existing SKU records...');
      const existingProducts = await productService.list({ brand: 'piaa' });
      const existingBySku = new Map(
        existingProducts.map((product) => [product.sku.trim().toLowerCase(), product] as const).filter(([sku]) => Boolean(sku)),
      );
      const existingSkus = new Set(existingProducts.map((product) => product.sku.trim().toLowerCase()).filter(Boolean));

      const productsWithPreservedImages = products.map((product) => {
        const skuKey = product.sku.trim().toLowerCase();
        const existing = existingBySku.get(skuKey);
        if (!existing) {
          return product;
        }

        return {
          ...product,
          imageReference: product.imageReference || existing.imageReference,
          galleryImageReferences:
            product.galleryImageReferences && product.galleryImageReferences.length > 0
              ? product.galleryImageReferences
              : existing.galleryImageReferences,
          folderName: product.folderName || existing.folderName,
        };
      });

      const actionById: Record<string, 'Update' | 'Add'> = {};
      let updateCount = 0;
      let addCount = 0;

      for (const product of productsWithPreservedImages) {
        const normalizedSku = product.sku.trim().toLowerCase();
        const action: 'Update' | 'Add' = normalizedSku && existingSkus.has(normalizedSku) ? 'Update' : 'Add';
        actionById[product.id] = action;
        if (action === 'Update') updateCount += 1;
        else addCount += 1;
      }

      addImportStatus(`Importing: ${updateCount} update(s), ${addCount} add(s)...`);
      await productService.upsertMany(productsWithPreservedImages);
      addImportStatus('Upload completed successfully.');

      setPendingUpdateCount(updateCount);
      setPendingAddCount(addCount);
      setPendingSkuActionById(actionById);
      setImportedProducts(productsWithPreservedImages);
      setImportReportGroups(buildImportReportGroups(productsWithPreservedImages));

      const summary = `Upload Completed: Imported ${productsWithPreservedImages.length} product(s). Skipped ${skippedRows} row(s). Alerts: ${actionableAlerts.length}.`;
      setMessage(`Imported ${productsWithPreservedImages.length} products. ${updateCount} updates, ${addCount} new.`);
      setCompletionSummary(summary);
      setIsCompletionModalOpen(true);
    } finally {
      // no-op
    }
  };

  const onCancelFilePreview = () => {
    setPendingFileName('');
    setPendingHeaders([]);
    setPendingRows([]);
    setIsFilePreviewOpen(false);
    setMessage('File selection cancelled.');
  };

  const onAlertRuleChange = (next: Partial<UploadAlertRules>) => {
    const merged = { ...alertRules, ...next };
    setAlertRules(merged);
    writeAlertRules(merged);
  };

  return (
    <AdminLayout title="Spreadsheet Upload">
      <div className="space-y-6">
        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-4">Step 1 - Choose Spreadsheet to upload</h2>
          <p className="text-sm text-gray-400 mb-4">
            Expected file like ---&gt; <strong>PIAA Retail - Pricelist Sept 1st 2025.xlsx</strong>
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Import mapping used: <strong>Column B</strong> = Part Number, <strong>Column C</strong> = Product Description,
            <strong>Column E</strong> = Retail Price (inc GST). Product filename/name uses <strong>B + C</strong>.
          </p>

          <input
            id="piaa-spreadsheet"
            type="file"
            accept=".xlsx,.xls,.csv,.txt,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(event) => void onFileSelected(event)}
            className="sr-only"
          />
          <label
            htmlFor="piaa-spreadsheet"
            className="inline-flex items-center cursor-pointer rounded border border-motorsport-yellow bg-motorsport-yellow/10 px-4 py-2 text-sm font-semibold text-motorsport-yellow hover:bg-motorsport-yellow/20 transition-colors"
          >
            Choose spreadsheet/CSV
          </label>

          <span className="ml-3 text-sm text-gray-400 align-middle">{fileName || 'No file selected'}</span>
          {headers.length > 0 && (
            <div className="mt-3 border border-motorsport-yellow/40 bg-motorsport-yellow/10 p-3">
              <p className="text-sm md:text-base font-semibold text-motorsport-yellow">
                Detected columns: Part Number | Category and Product Description | Number of Units Inc. | Retail
              </p>
              {hasRequiredColumns ? (
                <p className="text-sm text-motorsport-yellow mt-1">Looks Correct ✅</p>
              ) : (
                <p className="text-sm text-amber-300 mt-1">
                  Required 4 columns not found. Please check input file and try again.
                </p>
              )}
            </div>
          )}
        </div>

        {isFilePreviewOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Preview spreadsheet before loading</h3>
              <p className="text-sm text-gray-400 mb-4">
                File: <strong>{pendingFileName}</strong> — showing first 25 rows.
              </p>

              <div className="max-h-[60vh] overflow-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black sticky top-0">
                    <tr className="text-left text-gray-300">
                      {pendingHeaders.slice(0, 5).map((header) => (
                        <th key={header} className="px-3 py-2 border-b border-gray-800">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.slice(0, 25).map((row, idx) => (
                      <tr key={idx} className="odd:bg-black/20">
                        {pendingHeaders.slice(0, 5).map((header) => (
                          <td key={`${idx}-${header}`} className="px-3 py-2 border-b border-gray-900">
                            {row[header] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" className="btn-secondary" onClick={onCancelFilePreview}>
                  Cancel upload
                </button>
                <button type="button" className="btn-primary" onClick={onConfirmFilePreview}>
                  Continue with this file
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Load report</h2>
          <p className="text-sm text-gray-400 mb-3">
            Import now runs when you click <strong>Continue with this file</strong> in Step 1 preview.
          </p>

          {message && <p className="text-sm text-gray-300 mt-3">{message}</p>}

          {importStatusLines.length > 0 && (
            <div className="mt-4 border border-gray-700 bg-black/40 p-3">
              <p className="text-xs text-gray-300 mb-2">Import activity</p>
              <ul className="space-y-1">
                {importStatusLines.map((line, index) => (
                  <li key={`${line}-${index}`} className="text-xs text-gray-400">• {line}</li>
                ))}
              </ul>
            </div>
          )}

          {debugRows.length > 0 && (
            <div className="mt-4 border border-gray-800 bg-black/40 p-3">
              <p className="text-xs text-gray-300 mb-2">Unmatched section/header rows (sample):</p>
              <ul className="space-y-1">
                {debugRows.map((row, index) => (
                  <li key={`${row}-${index}`} className="text-xs text-gray-400">• {row}</li>
                ))}
              </ul>
            </div>
          )}

          {rowAlerts.length > 0 && (
            <div className="mt-4 border border-motorsport-yellow/50 bg-motorsport-yellow/10 p-3">
              <p className="text-sm text-motorsport-yellow mb-1">Sanity check alerts: {actionableAlerts.length}</p>
              <p className="text-xs text-motorsport-yellow/90 mb-2">
                Skipped lines: {pendingSkippedRows} (includes blank/non-data rows and invalid data rows)
              </p>
              <ul className="space-y-1 max-h-44 overflow-auto">
                {actionableAlerts.slice(0, 25).map((alert, idx) => (
                  <li key={`${alert.lineNumber}-${idx}`} className="text-xs text-motorsport-yellow/90">
                    Line {alert.lineNumber}: {alert.reason} [SKU: {alert.sku || 'N/A'} | Desc: {alert.description || 'N/A'} | Price:{' '}
                    {alert.price ?? 'N/A'}]
                  </li>
                ))}
              </ul>
              {actionableAlerts.length > 25 && <p className="text-xs text-motorsport-yellow mt-2">Showing first 25 alerts.</p>}
            </div>
          )}
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-lg font-heading font-bold mb-3">Upload checks and alerts</h2>
          <p className="text-sm text-gray-400 mb-4">These checks are stored in this system and run on each spreadsheet import.</p>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 items-center">
              <label className="text-sm text-gray-300">
                Max SKU length
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={alertRules.maxSkuLength}
                  onChange={(e) => onAlertRuleChange({ maxSkuLength: Number(e.target.value || 8) })}
                  className="mt-1 w-full bg-black border border-gray-700 px-3 py-2"
                />
              </label>
              <p className="text-xs text-gray-500">Keeps part numbers consistent with expected supplier format and avoids broken SKU matching.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 items-center">
              <label className="text-sm text-gray-300">
                Min retail price
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={alertRules.minRetailPrice}
                  onChange={(e) => onAlertRuleChange({ minRetailPrice: Number(e.target.value || 1) })}
                  className="mt-1 w-full bg-black border border-gray-700 px-3 py-2"
                />
              </label>
              <p className="text-xs text-gray-500">Flags zero/invalid pricing so non-sellable rows do not silently enter the catalog.</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>• Part number/SKU is required: {alertRules.requireSku ? 'Yes' : 'No'}</p>
            <p>• Description is required: {alertRules.requireDescription ? 'Yes' : 'No'}</p>
            <p>• Retail price is required: {alertRules.requirePrice ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {importReportGroups.length > 0 && (
          <div className="border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-lg font-heading font-bold mb-3">Full load report sequence</h2>
            <p className="text-sm text-gray-400 mb-4">
              Imported <strong>{importedProducts.length}</strong> products ({pendingUpdateCount} updates, {pendingAddCount} new), skipped{' '}
              <strong>{pendingSkippedRows}</strong> rows.
            </p>
            <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
              {importReportGroups.map((group, idx) => (
                <div key={`${group.category}-${group.subCategory ?? 'none'}-${idx}`} className="border border-gray-800 bg-black/30 p-3">
                  <p className="text-sm font-semibold text-motorsport-yellow">{group.category}</p>
                  {group.subCategory && <p className="text-xs text-gray-300 mt-1">Subcategory: {group.subCategory}</p>}
                  <ul className="mt-2 space-y-1">
                    {group.products.map((product) => (
                      <li key={product.id} className="text-xs text-gray-300">
                        • [{pendingSkuActionById[product.id] ?? 'Add'}] {product.sku} — {product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCompletionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl border border-gray-700 bg-gray-950 p-5">
              <h3 className="text-lg font-heading font-bold mb-2">Upload Completed</h3>
              <p className="text-sm text-gray-300 mb-4">{completionSummary}</p>
              {actionableAlerts.length > 0 && (
                <div className="border border-motorsport-yellow/50 bg-motorsport-yellow/10 p-3 mb-4">
                  <p className="text-sm text-motorsport-yellow">Alerts found: {actionableAlerts.length}</p>
                </div>
              )}
              <div className="flex justify-end">
                <button type="button" className="btn-primary" onClick={() => setIsCompletionModalOpen(false)}>
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

export default AdminSpreadsheetUploadPage;
