export function toPlainEvidenceCopy(value: string) {
  return value
    .replace(/employee-share\s*1%/gi, "bagian iuran pekerja 1%")
    .replace(/employee-share/gi, "bagian iuran pekerja")
    .replace(/company-period/gi, "perusahaan-periode");
}
