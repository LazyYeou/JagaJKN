export const P5_REPORT_CATEGORIES = [
  { code: "POTONGAN_TIDAK_JELAS", label: "Potongan iuran tidak jelas" },
  { code: "KONFIRMASI_IURAN_BELUM_JELAS", label: "Informasi konfirmasi iuran belum jelas" },
  { code: "KETIDAKSESUAIAN_INFORMASI_KONTRAK", label: "Ketidaksesuaian informasi kontrak" },
] as const;

export type P5ReportCategory = typeof P5_REPORT_CATEGORIES[number]["code"];

export function isP5ReportCategory(value: unknown): value is P5ReportCategory {
  return typeof value === "string" && P5_REPORT_CATEGORIES.some((category) => category.code === value);
}
