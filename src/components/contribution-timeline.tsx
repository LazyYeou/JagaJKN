import { contributionStatusCopy } from "@/domain/contribution-copy";
import { toPlainEvidenceCopy } from "@/components/evidence-copy";

type ContributionEntry = {
  period: string;
  employeeOnePercentAmount: number;
  deductionSource: string;
  companyPeriodReconciliation: {
    status: string;
    reason: string;
    delta: number | null;
    evaluationAsOf: Date | null;
    calculatedAt: Date | null;
    sourceLabel: string | null;
    sourceType: string | null;
  };
};

export function ContributionTimeline({ contributions }: { contributions: ContributionEntry[] }) {
  if (contributions.length === 0) {
    return <section className="surface"><h2>Belum ada potongan tercatat</h2><p className="muted">Belum tersedia data iuran untuk akun Anda.</p></section>;
  }

  return (
    <div className="contribution-list">
      <p className="notice" style={{ marginTop: 0 }}>Potongan Anda tercatat. Status ini merupakan pencocokan data pada tingkat perusahaan dan periode; bukan bukti pembayaran individual.</p>
      {contributions.map((contribution) => {
        const status = contributionStatusCopy(contribution.companyPeriodReconciliation.status);
        const showsDelta = (contribution.companyPeriodReconciliation.status === "MATCHED"
          || contribution.companyPeriodReconciliation.status === "MISMATCH")
          && contribution.companyPeriodReconciliation.delta !== null;
        return <article className={`surface contribution-entry contribution-${contribution.companyPeriodReconciliation.status.toLowerCase()}`} key={contribution.period}>
          <div className="contribution-summary"><p className="metric">Periode</p><h2 className="number">{contribution.period}</h2><p className="metric">Potongan pekerja 1%</p><strong className="deduction-value number">Rp{contribution.employeeOnePercentAmount.toLocaleString("id-ID")}</strong><p className="muted">{contribution.deductionSource === "Synthetic / Demo" ? "Catatan perusahaan" : contribution.deductionSource}</p></div>
          <div className="contribution-content"><p className="metric">Pencocokan tingkat perusahaan</p><span className={`risk-badge ${status.tone}`}>{status.label}</span>
          <p>{status.explanation}</p>
          {contribution.companyPeriodReconciliation.reason !== status.explanation
            && <p className="muted">{toPlainEvidenceCopy(contribution.companyPeriodReconciliation.reason)}</p>}
          {showsDelta && <p><strong>Selisih total konfirmasi dan potongan:</strong> {differenceCopy(contribution.companyPeriodReconciliation.delta!)}</p>}
          <div className="contribution-provenance">{contribution.companyPeriodReconciliation.sourceLabel && <p>{contribution.companyPeriodReconciliation.sourceLabel}</p>}{contribution.companyPeriodReconciliation.evaluationAsOf && <p>Bukti dinilai hingga {new Date(contribution.companyPeriodReconciliation.evaluationAsOf).toLocaleString("id-ID")}{contribution.companyPeriodReconciliation.calculatedAt ? ` · Hasil pemeriksaan disimpan ${new Date(contribution.companyPeriodReconciliation.calculatedAt).toLocaleString("id-ID")}` : ""}</p>}</div></div>
        </article>;
      })}
    </div>
  );
}

function differenceCopy(delta: number) {
  if (delta < 0) return `Konfirmasi lebih kecil Rp${Math.abs(delta).toLocaleString("id-ID")}.`;
  if (delta > 0) return `Konfirmasi lebih besar Rp${delta.toLocaleString("id-ID")}.`;
  return "Jumlah konfirmasi dan potongan sama.";
}
