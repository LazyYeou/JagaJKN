export function accountDisplayName(value: string) {
  return value
    .replace(/^Demo HR\s+—\s*/, "")
    .replace(/^Auditor Demo$/, "Auditor")
    .replace(/^Operator Demo$/, "Operator")
    .replace("Pekerja Simulasi", "Pekerja");
}

export function workerDisplayName(value: string) {
  return value.replace("Pekerja Simulasi", "Pekerja");
}

export function displayCompanyCode(value: string) {
  return value.replace(/^DEMO-/, "");
}

export function displayWorkerCode(value: string) {
  return value.replace(/^DEMO-/, "");
}

export function displayConfirmationReference(value: string) {
  return value.replace(/^MOCK-/, "").replace(/^DEMO-/, "");
}
