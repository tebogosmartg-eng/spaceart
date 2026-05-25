function formatTimestamp(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ModerationAuditMetaProps = {
  approvedAt?: string | null;
  rejectedAt?: string | null;
  publishedAt?: string | null;
};

export function ModerationAuditMeta({
  approvedAt,
  rejectedAt,
  publishedAt,
}: ModerationAuditMetaProps) {
  const approved = formatTimestamp(approvedAt ?? publishedAt);
  const rejected = formatTimestamp(rejectedAt);

  if (!approved && !rejected) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {approved && <span>Approved {approved}</span>}
      {rejected && <span>Rejected {rejected}</span>}
    </div>
  );
}
