export const categoryLabels: Record<string, string> = {
  STATUS_FEEDBACK_DISPUTE: "Klarifikasi status hubungan kerja",
  P1_REVIEW_CONTEXT: "Informasi perubahan kontrak",
  WAGE_COMPONENT_INCONSISTENCY: "Pemeriksaan kesesuaian upah",
  CONTRIBUTION_DELTA: "Pencocokan iuran tingkat perusahaan",
  REPORT_CLUSTER: "Jumlah laporan pekerja",
};
export const indicatorLabels: Record<string, string> = {
  P1_WORKER_STATUS_DISPUTE: "Klarifikasi status hubungan kerja",
  P1_RAPID_STATUS_VERSION_CHANGES: "Perubahan jenis hubungan kerja dalam waktu singkat",
  P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE: "Komponen upah tetap berbeda dari kontrak",
  P2_RECURRING_VARIABLE_COMPONENT: "Pola tunjangan variabel berulang",
  P3_CONFIRMED_EMPLOYEE_SHARE_DELTA: "Selisih pencocokan iuran pekerja 1%",
  P5_REPORT_COUNT_THRESHOLD: "Jumlah laporan mencapai batas penayangan",
};
export const processLabels: Record<string, string> = {
  P1: "Kontrak dan klarifikasi",
  P2: "Presensi dan upah",
  P3: "Potongan dan pencocokan iuran",
  P5: "Laporan pekerja",
};

export function userFacingCategoryLabel(code: string) {
  return categoryLabels[code] ?? "Bukti perusahaan";
}

export function userFacingIndicatorLabel(ruleCode: string, categoryCode: string) {
  return indicatorLabels[ruleCode] ?? categoryLabels[categoryCode] ?? "Pemeriksaan bukti perusahaan";
}
