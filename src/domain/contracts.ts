import { periodBounds } from "@/domain/period";

export type EffectiveContract = {
  id: string;
  workerId: string;
  versionNo: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type ContractClosureDate = {
  contractVersionId: string;
  effectiveTo: Date;
};

export function effectiveEndDate(version: EffectiveContract, closures: ContractClosureDate[]) {
  return closures.find((closure) => closure.contractVersionId === version.id)?.effectiveTo
    ?? version.effectiveTo;
}

export function contractCoversPeriod(
  version: EffectiveContract,
  closures: ContractClosureDate[],
  period: string,
) {
  const { start, end } = periodBounds(period);
  const effectiveTo = effectiveEndDate(version, closures);
  return version.effectiveFrom <= start && (effectiveTo === null || effectiveTo >= end);
}

export function selectContractForPeriod<T extends EffectiveContract>(
  versions: T[],
  closures: ContractClosureDate[],
  period: string,
) {
  const { start, end } = periodBounds(period);
  const overlapping = versions.filter((version) => {
    const effectiveTo = effectiveEndDate(version, closures);
    return version.effectiveFrom <= end && (effectiveTo === null || effectiveTo >= start);
  });
  const coveringWholePeriod = overlapping.filter((version) => contractCoversPeriod(version, closures, period));
  return overlapping.length === 1 && coveringWholePeriod.length === 1 ? coveringWholePeriod[0]! : null;
}

export function hasOverlappingContractRange(
  versions: EffectiveContract[],
  closures: ContractClosureDate[],
  candidate: EffectiveContract,
) {
  return versions.some((version) => {
    const existingEnd = effectiveEndDate(version, closures);
    const candidateEnd = effectiveEndDate(candidate, closures);
    const versionStartsBeforeCandidateEnds = candidateEnd === null || version.effectiveFrom <= candidateEnd;
    const candidateStartsBeforeVersionEnds = existingEnd === null || candidate.effectiveFrom <= existingEnd;
    return version.id !== candidate.id && versionStartsBeforeCandidateEnds && candidateStartsBeforeVersionEnds;
  });
}
