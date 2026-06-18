import { PIAA_CATEGORIES, WIPER_SUBCATEGORIES, type PiaaCategory, type Product } from '@/types/product';

export const PRODUCT_IMPORT_FIELDS = [
  'name',
  'sku',
  'description',
  'price',
  'imageReference',
] as const;

export type ProductImportField = (typeof PRODUCT_IMPORT_FIELDS)[number];

export type ProductImportMapping = Record<ProductImportField, string | null>;

export interface SpreadsheetImportResult {
  products: Product[];
  skippedRows: number;
  unmatchedSectionRows: string[];
}

export interface FixedColumnSpreadsheetImportResult {
  products: Product[];
  skippedRows: number;
  rowAlerts: Array<{
    lineNumber: number;
    sku: string;
    description: string;
    price: number | null;
    reason: string;
  }>;
}

export interface FixedColumnValidationOptions {
  maxSkuLength: number;
  minRetailPrice: number;
  requireSku: boolean;
  requireDescription: boolean;
  requirePrice: boolean;
}

const DEFAULT_FIXED_COLUMN_VALIDATION: FixedColumnValidationOptions = {
  maxSkuLength: 8,
  minRetailPrice: 1,
  requireSku: true,
  requireDescription: true,
  requirePrice: true,
};

const DEFAULT_MISSING_SKU = '999999';

const parsePrice = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseUnitsPerPackage = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const safeValue = (value: string | undefined): string => (value ?? '').trim();

const splitThirdPartySegments = (value: string): string[] =>
  value
    .split(/\|+/)
    .map((part) => part.trim())
    .filter(Boolean);

const sanitizeThirdPartySku = (value: string): string => {
  const segments = splitThirdPartySegments(value);
  const primary = segments[0] ?? value;
  const cleaned = primary.replace(/[^A-Za-z0-9-\s]/g, ' ').trim();
  const firstToken = cleaned.split(/\s+/).filter(Boolean)[0] ?? '';
  return firstToken;
};

const sanitizeThirdPartyDescription = (value: string): string => {
  const segments = splitThirdPartySegments(value);
  return (segments[0] ?? value).trim();
};

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

const CATEGORY_BY_KEY = new Map<string, PiaaCategory>(PIAA_CATEGORIES.map((category) => [normalizeKey(category), category]));
const WIPER_SUBCATEGORY_BY_KEY = new Map<string, string>(
  WIPER_SUBCATEGORIES.map((subcategory) => [normalizeKey(subcategory), subcategory]),
);
const NORMALIZED_PIAA_CATEGORIES = PIAA_CATEGORIES.map((category) => ({
  original: category,
  normalized: normalizeKey(category),
}));
const NORMALIZED_WIPER_SUBCATEGORIES = WIPER_SUBCATEGORIES.map((subcategory) => ({
  original: subcategory,
  normalized: normalizeKey(subcategory),
}));
const SI_TECH_SUBCATEGORY = WIPER_SUBCATEGORIES[0];
const SLIMVOGUE_SUBCATEGORY = WIPER_SUBCATEGORIES[1];

export const normalizePiaaCategory = (value: string): PiaaCategory | null => CATEGORY_BY_KEY.get(normalizeKey(value)) ?? null;

const findCategoryFromCandidates = (candidates: string[]): PiaaCategory | null => {
  for (const candidate of candidates) {
    const exact = normalizePiaaCategory(candidate);
    if (exact) {
      return exact;
    }
  }

  const normalizedCandidates = candidates.map((candidate) => normalizeKey(candidate)).filter(Boolean);
  for (const candidate of normalizedCandidates) {
    const fuzzy = NORMALIZED_PIAA_CATEGORIES.find(
      (item) => candidate.includes(item.normalized) || item.normalized.includes(candidate),
    );

    if (fuzzy) {
      return fuzzy.original;
    }
  }

  return null;
};

const findWiperSubCategoryFromCandidates = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    const exact = WIPER_SUBCATEGORY_BY_KEY.get(normalizeKey(candidate));
    if (exact) {
      return exact;
    }
  }

  const normalizedCandidates = candidates.map((candidate) => normalizeKey(candidate)).filter(Boolean);
  for (const candidate of normalizedCandidates) {
    const fuzzy = NORMALIZED_WIPER_SUBCATEGORIES.find(
      (item) => candidate.includes(item.normalized) || item.normalized.includes(candidate),
    );

    if (fuzzy) {
      return fuzzy.original;
    }
  }

  return null;
};

const inferWiperSubCategory = (candidates: string[]): string | null => {
  const direct = findWiperSubCategoryFromCandidates(candidates);
  if (direct) {
    return direct;
  }

  const combined = normalizeKey(candidates.join(' '));
  if (combined.includes('si tech') || combined.includes('si-tech')) {
    return SI_TECH_SUBCATEGORY;
  }

  if (combined.includes('slimvogue') || combined.includes('slim vogue')) {
    return SLIMVOGUE_SUBCATEGORY;
  }

  return null;
};

const isLikelyProductCode = (value: string): boolean => {
  const compact = value.replace(/\s+/g, '');
  if (!compact) {
    return false;
  }

  const hasValidChars = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(compact);
  const hasDigit = /\d/.test(compact);
  return hasValidChars && hasDigit;
};

const looksLikeRepeatedHeaderRow = (cells: string[]): boolean => {
  const normalized = cells.map((cell) => normalizeKey(cell));
  const joined = normalized.join(' ');
  return joined.includes('part number') && joined.includes('retail');
};

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const buildProductsFromFixedColumnsRows = (
  rows: Record<string, string>[],
  headers: string[],
  validation?: Partial<FixedColumnValidationOptions>,
): FixedColumnSpreadsheetImportResult => {
  const rules: FixedColumnValidationOptions = { ...DEFAULT_FIXED_COLUMN_VALIDATION, ...(validation ?? {}) };
  const now = new Date().toISOString();
  const findHeader = (match: (value: string) => boolean): string | null =>
    headers.find((header) => match(header.trim().toLowerCase())) ?? null;

  const partNumberHeader =
    findHeader((value) => value.includes('part') && value.includes('number')) ?? headers[1] ?? headers[0] ?? '';
  const descriptionHeader =
    findHeader((value) => value.includes('category') && value.includes('product') && value.includes('description')) ??
    headers[2] ??
    headers[1] ??
    '';
  const retailHeader =
    findHeader((value) => value === 'retail' || (value.includes('retail') && !value.includes('including'))) ??
    headers[3] ??
    headers[2] ??
    '';
  let skippedRows = 0;
  const rowAlerts: FixedColumnSpreadsheetImportResult['rowAlerts'] = [];
  let currentCategory: PiaaCategory | null = null;
  let currentWiperSubCategory: string | undefined;

  const products = rows
    .map((row, index): Product | null => {
      const lineNumber = index + 2;
      const partNumber = sanitizeThirdPartySku(safeValue(row[partNumberHeader]));
      const rawDescription = safeValue(row[descriptionHeader]);
      const description = sanitizeThirdPartyDescription(rawDescription);
      const retailRaw = safeValue(row[retailHeader]);
      const descriptionKey = normalizeKey(description);
      const partKey = normalizeKey(partNumber);

      const explicitCategory =
        normalizePiaaCategory(rawDescription) ??
        normalizePiaaCategory(description) ??
        findCategoryFromCandidates([rawDescription, description]);

      const explicitWiperSubCategory = inferWiperSubCategory([rawDescription, description, partNumber]);

      if (explicitCategory && !isLikelyProductCode(partNumber) && !retailRaw) {
        currentCategory = explicitCategory;
        currentWiperSubCategory = explicitCategory === 'Wiper Blades' ? WIPER_SUBCATEGORIES[0] : undefined;
        skippedRows += 1;
        return null;
      }

      if (currentCategory === 'Wiper Blades' && explicitWiperSubCategory && !isLikelyProductCode(partNumber) && !retailRaw) {
        currentWiperSubCategory = explicitWiperSubCategory;
        skippedRows += 1;
        return null;
      }

      const isLikelySectionLabel =
        !retailRaw &&
        !/\d/.test(partNumber) &&
        ['piaa', 'wiper', 'si-tech', 'si tech', 'slimvogue', 'slim vogue'].includes(partKey);

      if (isLikelySectionLabel) {
      if (currentCategory === 'Wiper Blades') {
          const sectionWiperSubCategory = inferWiperSubCategory([partNumber, description]);
          if (sectionWiperSubCategory) {
            currentWiperSubCategory = sectionWiperSubCategory;
          }
        }

        const sectionCategory =
          normalizePiaaCategory(description) ??
          normalizePiaaCategory(partNumber) ??
          findCategoryFromCandidates([description, partNumber]);

        if (sectionCategory) {
          currentCategory = sectionCategory;
          currentWiperSubCategory = sectionCategory === 'Wiper Blades' ? WIPER_SUBCATEGORIES[0] : undefined;
        }

        skippedRows += 1;
        return null;
      }

      if (!partNumber && currentCategory === 'Wiper Blades') {
        const explicitWiperSubCategory = findWiperSubCategoryFromCandidates([description]);
        if (explicitWiperSubCategory) {
          currentWiperSubCategory = explicitWiperSubCategory;
          return null;
        }
      }

      const categoryFromRow = explicitCategory ?? (descriptionKey.includes('wiper') ? 'Wiper Blades' : null);

      if (categoryFromRow && !isLikelyProductCode(partNumber)) {
        currentCategory = categoryFromRow;
        currentWiperSubCategory = categoryFromRow === 'Wiper Blades' ? WIPER_SUBCATEGORIES[0] : undefined;
        skippedRows += 1;
        return null;
      }

      const price = parsePrice(retailRaw);
      const hasAnyCoreInput = Boolean(partNumber || description || price !== null);

      const addAlert = (reason: string) => {
        rowAlerts.push({ lineNumber, sku: partNumber, description, price, reason });
      };

      if (!hasAnyCoreInput) {
        skippedRows += 1;
        return null;
      }

      if (!currentCategory) {
        skippedRows += 1;
        addAlert('No active category found yet for this row.');
        return null;
      }

      const resolvedPartNumber = partNumber || DEFAULT_MISSING_SKU;
      if (!partNumber) {
        addAlert(`Missing part number / SKU. Defaulted to ${DEFAULT_MISSING_SKU} for later correction.`);
      }

      const hasProductLikeSku = /\d/.test(resolvedPartNumber);
      const hasStrictSkuFormat = isLikelyProductCode(resolvedPartNumber) || resolvedPartNumber === DEFAULT_MISSING_SKU;

      if (resolvedPartNumber && resolvedPartNumber.length > rules.maxSkuLength && resolvedPartNumber !== DEFAULT_MISSING_SKU) {
        skippedRows += 1;
        addAlert(`Part number / SKU exceeds max length of ${rules.maxSkuLength} characters.`);
        return null;
      }

      if (rules.requireDescription && !description) {
        skippedRows += 1;
        addAlert('Missing product description.');
        return null;
      }

      if (rules.requirePrice && price === null) {
        skippedRows += 1;
        addAlert('Missing or invalid retail price.');
        return null;
      }

      if (price !== null && price < rules.minRetailPrice) {
        skippedRows += 1;
        addAlert(`Retail price must be at least $${rules.minRetailPrice.toFixed(2)}.`);
        return null;
      }

      if (!hasProductLikeSku || !hasStrictSkuFormat || !description || price === null) {
        skippedRows += 1;
        addAlert('Invalid row shape for required fields (SKU/description/price).');
        return null;
      }

      return {
        id: `piaa-generic-${normalizeKey(resolvedPartNumber)}-${lineNumber}`,
        brand: 'piaa',
        category: currentCategory,
        subCategory:
          currentCategory === 'Wiper Blades'
            ? currentWiperSubCategory ??
              inferWiperSubCategory([description, resolvedPartNumber]) ??
              (resolvedPartNumber.trim().toUpperCase().startsWith('WS')
                ? WIPER_SUBCATEGORIES[1]
                : resolvedPartNumber.trim().startsWith('97')
                  ? WIPER_SUBCATEGORIES[0]
                  : undefined)
            : undefined,
        name: description,
        sku: resolvedPartNumber,
        description,
        price,
        imageReference: '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((product): product is Product => product !== null);

  return { products, skippedRows, rowAlerts };
};

export const buildProductsFromMappedRows = (
  rows: Record<string, string>[],
  mapping: ProductImportMapping,
  category: PiaaCategory,
): Product[] => {
  const now = new Date().toISOString();

  return rows
    .map((row): Product | null => {
      const read = (field: ProductImportField): string => {
        const column = mapping[field];
        if (!column) {
          return '';
        }

        return safeValue(row[column]);
      };

      const name = read('name');
      const sku = read('sku');

      if (!name) {
        return null;
      }

      const product: Product = {
        id: makeId(),
        brand: 'piaa',
        category,
        name,
        sku,
        description: read('description'),
        price: parsePrice(read('price')),
        imageReference: read('imageReference'),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      return product;
    })
    .filter((product): product is Product => product !== null);
};

export const defaultMappingFromHeaders = (headers: string[]): ProductImportMapping => {
  const normalized = headers.map((header) => ({
    original: header,
    value: header.trim().toLowerCase(),
  }));

  const pick = (patterns: string[]): string | null => {
    const found = normalized.find((item) => patterns.some((pattern) => item.value.includes(pattern)));
    return found?.original ?? null;
  };

  return {
    name: pick(['name', 'product']),
    sku: pick(['sku', 'code', 'part']),
    description: pick(['description', 'details']),
    price: pick(['price', 'rrp', 'cost']),
    imageReference: pick(['image', 'photo', 'filename']),
  };
};

export const buildProductsFromSectionedSpreadsheetRows = (
  rows: Record<string, string>[],
  headers: string[],
): SpreadsheetImportResult => {
  const selectedHeaders = headers.slice(0, 4);
  const [partNumberHeader, descriptionHeader, unitsHeader, retailHeader] = selectedHeaders;
  const now = new Date().toISOString();
  let currentCategory: PiaaCategory | null = null;
  let currentSubCategory: string | undefined;
  let skippedRows = 0;
  const unmatchedSectionRows: string[] = [];

  const products = rows
    .map((row): Product | null => {
      const partNumber = safeValue(row[partNumberHeader]);
      const description = safeValue(row[descriptionHeader]);
      const unitsPerPackageRaw = safeValue(row[unitsHeader]);
      const retailRaw = safeValue(row[retailHeader]);
      const rowCells = selectedHeaders.map((header) => safeValue(row[header]));
      const nonEmptyCells = rowCells.filter(Boolean);

      const rowLooksEmpty = nonEmptyCells.length === 0;
      if (rowLooksEmpty) {
        return null;
      }

      if (looksLikeRepeatedHeaderRow(nonEmptyCells)) {
        return null;
      }

      if (currentCategory === 'Wiper Blades' && !unitsPerPackageRaw && !retailRaw) {
        const inferredWiperHeader = inferWiperSubCategory(nonEmptyCells);
        if (inferredWiperHeader) {
          currentSubCategory = inferredWiperHeader;
          return null;
        }
      }

      const isSectionLike =
        nonEmptyCells.length > 0 &&
        !unitsPerPackageRaw &&
        !retailRaw &&
        ((partNumber === '' && description !== '') ||
          (partNumber !== '' && description === '' && !isLikelyProductCode(partNumber)) ||
          (nonEmptyCells.length === 1 && !isLikelyProductCode(nonEmptyCells[0])));

      if (isSectionLike) {
        const category = findCategoryFromCandidates(nonEmptyCells);
        if (category) {
          currentCategory = category;
          currentSubCategory = category === 'Wiper Blades' ? SI_TECH_SUBCATEGORY : undefined;
          return null;
        }

        if (currentCategory === 'Wiper Blades') {
          const matchedSubCategory = inferWiperSubCategory(nonEmptyCells);
          if (matchedSubCategory) {
            currentSubCategory = matchedSubCategory;
            return null;
          }
        }

        if (unmatchedSectionRows.length < 8) {
          unmatchedSectionRows.push(nonEmptyCells.join(' | '));
        }

        skippedRows += 1;
        return null;
      }

      if (!currentCategory || !partNumber) {
        skippedRows += 1;
        return null;
      }

      return {
        id: `piaa-${normalizeKey(currentCategory)}-${normalizeKey(partNumber)}`,
        brand: 'piaa',
        category: currentCategory,
        subCategory:
          currentCategory === 'Wiper Blades'
            ? (currentSubCategory ?? inferWiperSubCategory([description, partNumber]) ?? undefined)
            : undefined,
        name: description || partNumber,
        sku: partNumber,
        description,
        unitsPerPackage: parseUnitsPerPackage(unitsPerPackageRaw),
        price: parsePrice(retailRaw),
        imageReference: '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((product): product is Product => product !== null);

  return { products, skippedRows, unmatchedSectionRows };
};
