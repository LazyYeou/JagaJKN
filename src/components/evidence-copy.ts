import { CONTRIBUTION_STATUS_COPY } from "@/domain/contribution-copy";

export function toPlainEvidenceCopy(value: string) {
  return value
    .replace(/Agregat employee-share 1% (Rp[\d.]+) dibanding potongan (Rp[\d.]+)\./gi, "Total konfirmasi bagian iuran pekerja 1% sebesar $1 dibanding total potongan sebesar $2.")
    .replace(/Ditemukan selisih pada agregat potongan 1% dan konfirmasi bagian iuran pekerja simulasi; perlu verifikasi\./gi, "Ditemukan selisih antara total potongan pekerja 1% dan jumlah konfirmasi simulasi; perlu verifikasi.")
    .replace(/Agregat potongan pekerja 1% dan konfirmasi bagian iuran pekerja simulasi cocok dalam toleransi\./gi, "Total potongan pekerja 1% dan konfirmasi simulasi untuk iuran pekerja 1% cocok dalam batas selisih yang diperbolehkan.")
    .replace(/Data potongan 1% pekerja belum lengkap atau tidak sebanding untuk perusahaan\/periode ini\./gi, "Data potongan iuran pekerja 1% belum lengkap untuk perusahaan dan periode ini.")
    .replace(/Feedback terkait klasifikasi hubungan kerja terdeteksi pada kontrak efektif ([\d-]+); ini laporan pekerja, bukan penetapan hukum\./gi, "Klarifikasi mengenai jenis hubungan kerja diterima untuk kontrak yang berlaku pada $1; ini masukan pekerja, bukan penetapan hukum.")
    .replace(/Tidak ada feedback status kerja yang memenuhi kriteria pada kontrak efektif ([\d-]+)\./gi, "Belum ada klarifikasi status kerja yang memenuhi kriteria pada kontrak yang berlaku untuk $1.")
    .replace(/Ada dua atau lebih perubahan klasifikasi efektif dalam tiga bulan hingga ([\d-]+); konteks tinjauan informasional, bukan pelanggaran\./gi, "Ada dua atau lebih perubahan jenis hubungan kerja dalam tiga bulan hingga $1; informasi ini untuk konteks pemeriksaan, bukan bukti pelanggaran.")
    .replace(/Bukti pembanding employee-share 1% belum cukup; delta tidak tersedia\./gi, "Bukti pembanding untuk iuran pekerja 1% belum cukup; selisih belum dapat dihitung.")
    .replace(/Konfirmasi employee-share belum tersedia pada waktu skenario; belum dapat diverifikasi\./gi, "Konfirmasi bagian iuran pekerja belum tersedia untuk periode ini; pencocokan belum dapat diverifikasi.")
    .replace(/Konfirmasi simulasi tidak menyediakan jumlah employee-share yang sebanding\./gi, "Konfirmasi simulasi tidak mencantumkan jumlah iuran pekerja 1% yang dapat dibandingkan.")
    .replace(/Konteks informasional P1; tidak menambah skor\./gi, "Informasi tambahan mengenai kontrak; tidak menambah skor.")
    .replace(/Indikator P2 belum dievaluasi\./gi, "Pemeriksaan kesesuaian upah belum dapat dilakukan karena bukti belum cukup.")
    .replace(/Ambang agregasi P5 terpenuhi/gi, "Jumlah laporan minimum terpenuhi")
    .replace(/Belum ada cluster laporan yang memenuhi ambang agregasi\./gi, "Belum ada jumlah laporan yang mencapai batas untuk ditampilkan.")
    .replace(/Jumlah di bawah ambang tidak ditampilkan atau digunakan dalam skor\./gi, "Jumlah laporan di bawah batas tidak ditampilkan atau digunakan dalam penilaian.")
    .replace(/employee-share\s*1%/gi, "bagian iuran pekerja 1%")
    .replace(/employee-share/gi, "bagian iuran pekerja")
    .replace(/company-period/gi, "tingkat perusahaan pada periode yang sama")
    .replace(/\bP1\b/g, "kontrak")
    .replace(/\bP2\b/g, "pemeriksaan upah")
    .replace(/\bP3\b/g, "pencocokan iuran")
    .replace(/\bP4\b/g, "penilaian prioritas pemeriksaan")
    .replace(/\bP5\b/g, "laporan pekerja")
    .replace(/\bdelta\b/gi, "selisih")
    .replace(/\bcluster laporan\b/gi, "kelompok laporan")
    .replace(/\bambang agregasi\b/gi, "batas jumlah laporan")
    .replace(/\bagregat\b/gi, "total tingkat perusahaan")
    .replace(/\bprovisional\b/gi, "sementara")
    .replace(/\bsnapshot\b/gi, "hasil pemeriksaan tersimpan")
    .replace(/\bas-of\b/gi, "dinilai hingga")
    .replace(/\bfeedback\b/gi, "klarifikasi");
}

export function coverageStatusLabel(status: string) {
  return status === "COMPLETE" ? "Bukti lengkap" : "Bukti belum lengkap";
}

const fieldLabels: Record<string, string> = {
  baseWage: "upah pokok",
  baseWageReported: "upah pokok yang dilaporkan",
  fixedAllowance: "tunjangan tetap",
  fixedAllowanceReported: "tunjangan tetap yang dilaporkan",
  variableAllowanceReported: "tunjangan variabel yang dilaporkan",
  reportedContributionBase: "dasar iuran yang dilaporkan",
  employeeOnePercentAmount: "potongan iuran pekerja 1%",
  actualHours: "jam kerja aktual",
  overtimeHours: "jam lembur",
  expectedHoursPerMonth: "jam kerja per bulan",
};

export function toUserFacingError(value: unknown, fallback = "Permintaan belum dapat diproses. Periksa isian lalu coba lagi.") {
  const raw = value instanceof Error ? value.message : typeof value === "string" ? value : "";
  if (!raw) return fallback;
  if (/Authentication required|session expired/i.test(raw)) return "Sesi Anda berakhir. Masuk kembali untuk melanjutkan.";
  if (/Access denied|scope is missing/i.test(raw)) return "Anda tidak memiliki akses untuk melakukan tindakan ini.";
  if (/UUID|submission id|ID pengiriman/i.test(raw)) return "Pengiriman laporan belum dapat diproses. Coba kirim ulang tanpa mengubah periode atau kategori.";
  if (/object JSON|JSON/i.test(raw)) return "Isian belum dapat dibaca. Periksa kembali data yang dimasukkan.";
  if (/records\[|records harus|records\.workerId/i.test(raw)) return "Periksa daftar pekerja dan pastikan setiap pekerja hanya tercantum satu kali.";
  if (/Pekerja .* tercantum lebih dari sekali/i.test(raw)) return "Pekerja yang sama tercantum lebih dari satu kali. Periksa kembali data.";

  let copy = raw;
  for (const [field, label] of Object.entries(fieldLabels)) {
    copy = copy.replace(new RegExp(`\\b${field}\\b`, "g"), label);
  }
  copy = toPlainEvidenceCopy(copy);
  copy = copy.replace(/\bMATCHED\b/g, "Cocok")
    .replace(/\bMISMATCH\b/g, "Terdapat Selisih")
    .replace(/\bPENDING\b/g, "Menunggu Konfirmasi")
    .replace(/\bUNVERIFIED\b/g, "Belum Dapat Diverifikasi")
    .replace(/\bCOMPLETE\b/g, "Bukti lengkap")
    .replace(/\bINCOMPLETE\b/g, "Bukti belum lengkap")
    .replace(/harus berupa rupiah bulat non-negatif/gi, "harus berupa jumlah rupiah bulat, nol atau lebih")
    .replace(/harus bilangan bulat non-negatif/gi, "harus berupa angka bulat, nol atau lebih")
    .replace(/harus menggunakan format YYYY-MM-DD/gi, "harus menggunakan format tanggal, contoh 2026-09-01")
    .replace(/Periode harus menggunakan format YYYY-MM\./gi, "Periode harus menggunakan format tahun-bulan, contoh 2026-09.")
    .replace(/Format JSON tidak valid\./gi, "Isian tidak dapat dibaca. Periksa kembali data yang dimasukkan.");

  if (/^(Internal Server Error|Request failed|Failed to fetch)$/i.test(copy.trim())) return fallback;
  return copy;
}

export function contributionStatusLabel(status: string) {
  return CONTRIBUTION_STATUS_COPY[status as keyof typeof CONTRIBUTION_STATUS_COPY]?.label ?? CONTRIBUTION_STATUS_COPY.UNVERIFIED.label;
}
