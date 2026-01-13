/**
 * CSV Utilities for batch import functionality
 */

/**
 * Parse CSV content into an array of objects.
 * Handles both comma and semicolon delimiters, and quoted values.
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Detect delimiter (comma or semicolon)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';

    // Parse header row
    const headers = parseCsvLine(headerLine, delimiter);

    // Parse data rows
    const result: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCsvLine(line, delimiter);
        const row: Record<string, string> = {};

        headers.forEach((header, idx) => {
            row[header.trim()] = (values[idx] || '').trim();
        });

        result.push(row);
    }

    return result;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

/**
 * Format a date string for database storage (YYYY-MM-DD format)
 * Handles various input formats:
 * - DD/MM/YYYY
 * - YYYY-MM-DD
 * - DD-MM-YYYY
 * - MM/DD/YYYY (if month > 12, swaps to DD/MM)
 */
export function formatDateForDB(dateStr: string): string | null {
    if (!dateStr || !dateStr.trim()) return null;

    const trimmed = dateStr.trim();

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // DD/MM/YYYY or DD-MM-YYYY format
    const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
        let [, part1, part2, year] = slashMatch;
        let day = parseInt(part1, 10);
        let month = parseInt(part2, 10);

        // If day > 12, assume DD/MM format; otherwise try to be smart
        if (day > 12) {
            // Definitely DD/MM/YYYY
        } else if (month > 12) {
            // Must be MM/DD/YYYY, swap
            [day, month] = [month, day];
        }
        // else assume DD/MM/YYYY (more common in Arabic contexts)

        const dayStr = day.toString().padStart(2, '0');
        const monthStr = month.toString().padStart(2, '0');

        return `${year}-${monthStr}-${dayStr}`;
    }

    // Try to parse with Date constructor as last resort
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Generate CSV content from data rows
 */
export function generateCSV(headers: string[], rows: string[][]): string {
    const escapeCell = (cell: string) => {
        const str = cell?.toString() || '';
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map(row => row.map(escapeCell).join(','));

    return [headerLine, ...dataLines].join('\n');
}
