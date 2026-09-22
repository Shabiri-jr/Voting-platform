import { describe, expect, it } from "vitest";
import { escapeCsvCell, parseStudentCsv } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it.each(["=1+1", "+SUM(A1:A2)", "-2+3", "@cmd", "\tformula", "\rformula"])(
    "neutralizes spreadsheet formula prefix %s",
    (value) => {
      expect(escapeCsvCell(value)).toContain("'");
    },
  );

  it("quotes commas and escapes embedded quotes", () => {
    expect(escapeCsvCell('Dabiri, "Sayo"')).toBe('"Dabiri, ""Sayo"""');
  });
});

describe("parseStudentCsv", () => {
  it("parses the documented roster format", () => {
    const students = parseStudentCsv(
      [
        "matric_number,first_name,surname,department,level",
        "du/csc/2021/001,Sayo,Dabiri,Computer Science,400L",
      ].join("\n"),
    );
    expect(students).toEqual([
      {
        matricNumber: "DU/CSC/2021/001",
        firstName: "Sayo",
        surname: "Dabiri",
        department: "Computer Science",
        level: "400L",
      },
    ]);
  });

  it("rejects duplicate matric numbers in one file", () => {
    const csv = [
      "matric_number,first_name,surname,department,level",
      "DU/CSC/2021/001,Sayo,Dabiri,Computer Science,400L",
      "du/csc/2021/001,Temi,Ade,Mass Communication,300L",
    ].join("\n");
    expect(() => parseStudentCsv(csv)).toThrow("repeats a matric number");
  });
});
