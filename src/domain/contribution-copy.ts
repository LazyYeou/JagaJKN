export type ContributionStatusCode = "MATCHED" | "MISMATCH" | "PENDING" | "UNVERIFIED";

export const CONTRIBUTION_STATUS_COPY: Record<ContributionStatusCode, { label: string; explanation: string; tone: string }> = {
  MATCHED: {
    label: "Cocok",
    explanation: "Potongan dan konfirmasi komponen iuran pekerja cocok pada tingkat perusahaan untuk periode ini.",
    tone: "risk-low",
  },
  MISMATCH: {
    label: "Terdapat Selisih",
    explanation: "Data potongan dan data konfirmasi pembanding tidak sama; memerlukan pemeriksaan lebih lanjut.",
    tone: "risk-high",
  },
  PENDING: {
    label: "Menunggu Konfirmasi",
    explanation: "Konfirmasi belum diharapkan tersedia untuk periode ini. Status akan diperbarui setelah waktu konfirmasi tiba.",
    tone: "risk-medium",
  },
  UNVERIFIED: {
    label: "Belum Dapat Diverifikasi",
    explanation: "Data konfirmasi belum tersedia atau komponen iuran yang dibandingkan berbeda.",
    tone: "risk-incomplete",
  },
};

export function contributionStatusCopy(status: string) {
  return CONTRIBUTION_STATUS_COPY[status as ContributionStatusCode] ?? CONTRIBUTION_STATUS_COPY.UNVERIFIED;
}
