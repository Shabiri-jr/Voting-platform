export const MATRIC_NUMBER_EXAMPLE = "DU0001";
export const MATRIC_NUMBER_PATTERN =
  /^DU(?:\d{4}|\/[A-Z0-9]{2,12}\/\d{4}\/\d{3,6})$/;
export const MATRIC_NUMBER_FORMAT_MESSAGE =
  "Use DU0001 or DU/CSC/2021/001.";

export function normalizeMatricNumber(value: string) {
  return value.trim().toUpperCase();
}
