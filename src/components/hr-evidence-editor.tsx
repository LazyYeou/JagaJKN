"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toPlainEvidenceCopy } from "@/components/evidence-copy";
import { SectionHeader } from "@/components/ui";
import { contributionStatusCopy } from "@/domain/contribution-copy";
import { coverageStatusLabel, toUserFacingError } from "@/components/evidence-copy";

type ContractDefaults = {
  employmentType: string;
  baseWage: number;
  fixedAllowance: number;
  expectedHoursPerMonth: number;
} | null;

type WorkerPeriodEvidence = {
  period: string;
  attendance: { actualHours: number; overtimeHours: number } | null;
  payroll: { baseWageReported: number; fixedAllowanceReported: number; variableAllowanceReported: number; reportedContributionBase: number } | null;
  deduction: { employeeOnePercentAmount: number } | null;
};

type Operation = "contract" | "attendance" | "payroll" | "deduction";
type RetryRequest = { operation: Operation; endpoint: string; body: unknown; successLabel: string };

export function HrEvidenceEditor({ workerId, period, evidence, latestContract }: {
  workerId: string;
  period: string;
  evidence: WorkerPeriodEvidence;
  latestContract: ContractDefaults;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Operation | null>(null);
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [workspace, setWorkspace] = useState<"source" | "contract">("source");
  const [sourceTask, setSourceTask] = useState<"attendance" | "payroll" | "deduction">("payroll");
  const [noticeOperation, setNoticeOperation] = useState<Operation | null>(null);
  const [draft, setDraft] = useState({ employmentType: latestContract?.employmentType ?? "PKWTT", baseWage: String(latestContract?.baseWage ?? ""), fixedAllowance: String(latestContract?.fixedAllowance ?? ""), expectedHoursPerMonth: String(latestContract?.expectedHoursPerMonth ?? "") });

  async function send(operation: Operation, endpoint: string, body: unknown, successLabel: string) {
    const request = { operation, endpoint, body, successLabel };
    setActive(operation);
    setNoticeOperation(operation);
    setNotice("Menyimpan bukti dan memeriksa kesesuaian upah serta iuran…");
    setIsError(false);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(result.error));
      if (result.evaluation) {
        const fired = result.evaluation.indicators.filter((indicator: { triggered: boolean }) => indicator.triggered);
        const explanations = result.evaluation.indicators
          .filter((indicator: { triggered: boolean }) => indicator.triggered)
          .map((indicator: { explanation: string }) => toPlainEvidenceCopy(indicator.explanation))
          .join(" ");
        setNotice(`${successLabel}. ${coverageStatusLabel(result.evaluation.coverageState)}. ${fired.length > 0 ? `Perlu ditinjau: ${explanations}` : "Belum ditemukan perbedaan pada bukti yang diperiksa."}`);
      } else if (result.reconciliation) {
        const status = contributionStatusCopy(result.reconciliation.status);
        const delta = result.reconciliation.delta === null ? "" : ` ${reconciliationDifferenceCopy(result.reconciliation.delta)}`;
        setNotice(`${successLabel}. Pencocokan iuran perusahaan untuk periode ini: ${status.label}. ${toPlainEvidenceCopy(result.reconciliation.reason)}${delta}`);
      } else {
        setNotice(`${successLabel}. Versi kontrak berhasil diterbitkan; versi terdahulu tetap tersimpan.`);
      }
      setRetryRequest(null);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setNotice(toUserFacingError(error));
      setRetryRequest(request);
    } finally {
      setActive(null);
    }
  }

  function publishContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const effectiveFrom = String(values.get("effectiveFrom"));
    void send("contract", `/api/hr/workers/${workerId}/contracts`, {
      effectiveFrom: values.get("effectiveFrom"),
      employmentType: values.get("employmentType"),
      baseWage: Number(values.get("baseWage")),
      fixedAllowance: Number(values.get("fixedAllowance")),
      expectedHoursPerMonth: Number(values.get("expectedHoursPerMonth")),
    }, `Versi baru efektif ${effectiveFrom} tersimpan`);
  }

  function submitRecord(event: FormEvent<HTMLFormElement>, kind: "attendance" | "payroll" | "deduction") {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const recordPeriod = values.get("period");
    const worker = { workerId };
    if (kind === "attendance") {
      void send(kind, "/api/hr/attendance/import", { period: recordPeriod, records: [{
        ...worker,
        actualHours: Number(values.get("actualHours")),
        overtimeHours: Number(values.get("overtimeHours")),
      }] }, "Presensi tersimpan");
    } else if (kind === "payroll") {
      const baseWageReported = Number(values.get("baseWageReported"));
      const fixedAllowanceReported = Number(values.get("fixedAllowanceReported"));
      const variableAllowanceReported = Number(values.get("variableAllowanceReported"));
      void send(kind, "/api/hr/payroll/import", { period: recordPeriod, records: [{
        ...worker,
        baseWageReported,
        fixedAllowanceReported,
        variableAllowanceReported,
        reportedContributionBase: Number(values.get("reportedContributionBase")),
      }] }, "Data upah tersimpan");
    } else {
      void send(kind, "/api/hr/deductions/import", { period: recordPeriod, records: [{
        ...worker,
        employeeOnePercentAmount: Number(values.get("employeeOnePercentAmount")),
      }] }, "Potongan tersimpan");
    }
  }

  function feedback() {
    return notice && <div className={`status-message${isError ? " status-error" : ""}`} role={isError ? "alert" : "status"}>
        <p>{notice}</p>
        {isError && retryRequest && <button className="logout-button" disabled={active !== null} onClick={() => void send(retryRequest.operation, retryRequest.endpoint, retryRequest.body, retryRequest.successLabel)} type="button">Coba lagi</button>}
      </div>;
  }

  return (
    <div className="editor-workspace" id="evidence-editor">
      <div className="workspace-picker" role="group" aria-label="Tugas pemeliharaan"><button type="button" aria-pressed={workspace === "source"} onClick={() => setWorkspace("source")}>Presensi, upah & potongan</button><button type="button" aria-pressed={workspace === "contract"} onClick={() => setWorkspace("contract")}>Versi kontrak</button></div>
      <section className="surface section-gap" id="contract-editor" hidden={workspace !== "contract"}>
        <SectionHeader title="Terbitkan versi kontrak" description="Perubahan membuat versi baru; isi versi sebelumnya tetap tersimpan." />
        <p className="muted">Versi baru mengikuti periode berikutnya ({period}); tanggal efektif harus tanggal 1. Versi sebelumnya tetap tersimpan.</p>
        <form className="form-grid" onSubmit={publishContract} onChange={event => { const values = new FormData(event.currentTarget); setDraft({ employmentType: String(values.get("employmentType")), baseWage: String(values.get("baseWage")), fixedAllowance: String(values.get("fixedAllowance")), expectedHoursPerMonth: String(values.get("expectedHoursPerMonth")) }); }}>
          <label>Tanggal efektif<input name="effectiveFrom" type="date" defaultValue={(() => { const [year, month] = period.split("-").map(Number); const nextMonth = new Date(Date.UTC(year!, month!, 1)); return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`; })()} required /></label>
          <label>Jenis hubungan kerja<input name="employmentType" defaultValue={latestContract?.employmentType ?? "PKWTT"} maxLength={50} required /></label>
          <label>Upah pokok (IDR)<input name="baseWage" type="number" min="0" step="1" defaultValue={latestContract?.baseWage ?? ""} required /></label>
          <label>Tunjangan tetap (IDR)<input name="fixedAllowance" type="number" min="0" step="1" defaultValue={latestContract?.fixedAllowance ?? ""} required /></label>
          <label>Jam kerja per bulan<input name="expectedHoursPerMonth" type="number" min="1" step="1" defaultValue={latestContract?.expectedHoursPerMonth ?? ""} required /></label>
          <div className="change-preview form-full"><h3>Periksa perubahan sebelum menerbitkan</h3><table><thead><tr><th>Komponen</th><th>Kontrak efektif</th><th>Versi baru</th></tr></thead><tbody>{([
            ["Hubungan kerja", latestContract?.employmentType, draft.employmentType],
            ["Upah pokok (IDR)", latestContract?.baseWage, draft.baseWage],
            ["Tunjangan tetap (IDR)", latestContract?.fixedAllowance, draft.fixedAllowance],
            ["Jam / bulan", latestContract?.expectedHoursPerMonth, draft.expectedHoursPerMonth],
          ] as const).map(([label, before, after]) => <tr key={label}><td>{label}</td><td>{before ?? "Belum tersedia"}</td><td className={String(before ?? "") !== after ? "changed" : undefined}>{after || "Belum diisi"}{String(before ?? "") !== after && " · Diubah"}</td></tr>)}</tbody></table></div>
          <button className="button-primary" disabled={active !== null} type="submit">{active === "contract" ? "Menyimpan…" : "Terbitkan versi baru"}</button>
        </form>
        {noticeOperation === "contract" && feedback()}
      </section>

      <section className="surface section-gap" id="source-editor" hidden={workspace !== "source"}>
        <SectionHeader title="Perbarui data perusahaan" description={`Periode ${period} · Nominal dalam rupiah bulat`} />
        <p className="muted">Perbarui presensi, data upah, atau potongan pekerja untuk periode ini.</p>
        <div className="workspace-picker source-picker" role="group" aria-label="Jenis data perusahaan">{([['attendance', 'Presensi'], ['payroll', 'Data upah'], ['deduction', 'Potongan 1%']] as const).map(([task, label]) => <button key={task} type="button" aria-pressed={sourceTask === task} onClick={() => setSourceTask(task)}>{label}</button>)}</div>
        <div className="source-editors">
          <form className="form-grid" hidden={sourceTask !== "attendance"} onSubmit={(event) => submitRecord(event, "attendance")}>
             <h3>01 · Presensi</h3>
            <label>Periode<input name="period" value={period} readOnly required /></label>
            <label>Jam aktual<input name="actualHours" type="number" min="0" step="1" defaultValue={evidence.attendance?.actualHours ?? ""} required /></label>
            <label>Jam lembur<input name="overtimeHours" type="number" min="0" step="1" defaultValue={evidence.attendance?.overtimeHours ?? ""} required /></label>
            <button className="logout-button" disabled={active !== null} type="submit">Simpan presensi</button>
          </form>
          <form className="form-grid" hidden={sourceTask !== "payroll"} onSubmit={(event) => submitRecord(event, "payroll")}>
              <h3>02 · Data upah</h3>
            <label>Periode<input name="period" value={period} readOnly required /></label>
            <label>Upah pokok dilaporkan<input name="baseWageReported" type="number" min="0" step="1" defaultValue={evidence.payroll?.baseWageReported ?? ""} required /></label>
            <label>Tunjangan tetap dilaporkan<input name="fixedAllowanceReported" type="number" min="0" step="1" defaultValue={evidence.payroll?.fixedAllowanceReported ?? ""} required /></label>
            <label>Tunjangan variabel dilaporkan<input name="variableAllowanceReported" type="number" min="0" step="1" defaultValue={evidence.payroll?.variableAllowanceReported ?? ""} required /></label>
            <label>Dasar iuran dilaporkan<input name="reportedContributionBase" type="number" min="0" step="1" defaultValue={evidence.payroll?.reportedContributionBase ?? ""} required /></label>
            <button className="logout-button" disabled={active !== null} type="submit">Simpan data upah</button>
          </form>
          <form className="form-grid" hidden={sourceTask !== "deduction"} onSubmit={(event) => submitRecord(event, "deduction")}>
             <h3>03 · Potongan pekerja 1%</h3>
            <label>Periode<input name="period" value={period} readOnly required /></label>
            <label>Potongan (IDR)<input name="employeeOnePercentAmount" type="number" min="0" step="1" defaultValue={evidence.deduction?.employeeOnePercentAmount ?? ""} required /></label>
            <button className="logout-button" disabled={active !== null} type="submit">Simpan potongan & lakukan pencocokan</button>
          </form>
        </div>
        {noticeOperation !== "contract" && feedback()}
      </section>
    </div>
  );
}

function reconciliationDifferenceCopy(delta: number) {
  if (delta < 0) return `Konfirmasi lebih kecil Rp${Math.abs(delta).toLocaleString("id-ID")} dibanding total potongan pekerja.`;
  if (delta > 0) return `Konfirmasi lebih besar Rp${delta.toLocaleString("id-ID")} dibanding total potongan pekerja.`;
  return "Total konfirmasi dan total potongan pekerja sama.";
}
