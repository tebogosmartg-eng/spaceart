/** True when the Storage API reports the bucket itself is missing (not object/path). */
export function storageErrorIndicatesMissingBucket(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("bucket not found") ||
    lower.includes("bucket does not exist") ||
    lower.includes("no such bucket")
  );
}
