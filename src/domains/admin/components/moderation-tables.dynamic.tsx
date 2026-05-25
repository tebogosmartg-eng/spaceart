import dynamic from "next/dynamic";
import { ModerationTableSkeleton } from "./moderation-table-skeleton";

export const ListingsModerationTable = dynamic(
  () =>
    import("./listings-moderation-table").then((mod) => ({
      default: mod.ListingsModerationTable,
    })),
  { loading: () => <ModerationTableSkeleton rows={8} /> }
);

export const CreatorsModerationTable = dynamic(
  () =>
    import("./creators-moderation-table").then((mod) => ({
      default: mod.CreatorsModerationTable,
    })),
  { loading: () => <ModerationTableSkeleton rows={8} /> }
);
