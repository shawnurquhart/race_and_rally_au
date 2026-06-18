export interface ParsedCsvData {
  headers: string[];
  rows: Record<string, string>[];
}

const parseDelimitedLine = (line: string, delimiter: ',' | '\t'): string[] => {
  if (delimiter === '\t') {
    return line.split('\t').map((value) => value.trim());
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

export const parseCsv = (content: string): ParsedCsvData => {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerLine = lines[0];
  const delimiter: ',' | '\t' = (headerLine.match(/\t/g)?.length ?? 0) > (headerLine.match(/,/g)?.length ?? 0) ? '\t' : ',';

  const headers = parseDelimitedLine(headerLine, delimiter);
  const rows = lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? '';
      return record;
    }, {});
  });

  return { headers, rows };
};
