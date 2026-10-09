export function nextSnapshotTimestamp(requestedAt: Date, latestAt: Date | null) {
  if (latestAt && requestedAt.getTime() <= latestAt.getTime()) {
    return new Date(latestAt.getTime() + 1);
  }
  return requestedAt;
}
