import { studentCsvRowSchema } from "@/lib/validation";

const MAX_CSV_BYTES = 2_000_000;
const MAX_CSV_ROWS = 10_000;
const EXPECTED_HEADERS = [
  "matric_number",
  "first_name",
  "surname",
  "department",
  "level",
] as const;

export interface CsvStudent {
  matricNumber: string;
  firstName: string;
  surname: string;
  department: string;
  level: string;
}

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (field.length > 0) throw new Error("Malformed CSV quoting");
      quoted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (quoted) throw new Error("Unclosed CSV quote");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records.filter((row) => row.some((value) => value.trim() !== ""));
}

export function normalizeMatricNumber(value: string) {
  return value.trim().toUpperCase();
}

export function parseStudentCsv(input: string): CsvStudent[] {
  if (Buffer.byteLength(input, "utf8") > MAX_CSV_BYTES) {
    throw new Error("CSV exceeds 2 MB");
  }

  const records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new Error("CSV must include a header and data");
  if (records.length - 1 > MAX_CSV_ROWS) {
    throw new Error(`CSV exceeds ${MAX_CSV_ROWS} data rows`);
  }

  const headers = records[0].map((header) => header.trim().toLowerCase());
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    !EXPECTED_HEADERS.every((header, index) => headers[index] === header)
  ) {
    throw new Error(`CSV headers must be: ${EXPECTED_HEADERS.join(",")}`);
  }

  const seen = new Set<string>();
  return records.slice(1).map((record, index) => {
    if (record.length !== headers.length) {
      throw new Error(`Row ${index + 2} has the wrong number of columns`);
    }

    const parsed = studentCsvRowSchema.safeParse(
      Object.fromEntries(headers.map((header, column) => [header, record[column]])),
    );
    if (!parsed.success) {
      throw new Error(`Row ${index + 2} is invalid`);
    }

    const matricNumber = normalizeMatricNumber(parsed.data.matric_number);
    if (seen.has(matricNumber)) {
      throw new Error(`Row ${index + 2} repeats a matric number`);
    }
    seen.add(matricNumber);

    return {
      matricNumber,
      firstName: parsed.data.first_name.trim(),
      surname: parsed.data.surname.trim(),
      department: parsed.data.department.trim(),
      level: parsed.data.level.trim(),
    };
  });
}

export function escapeCsvCell(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
