"use client";

import { useTransition } from "react";
import {
  approveCreativeAction,
  rejectCreativeAction,
  approveListingAction,
  rejectListingAction,
} from "../actions/review-actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { Creative, ListingWithRelations } from "@/shared/types/database";

interface ReviewQueueProps {
  pendingCreatives: Creative[];
  pendingListings: ListingWithRelations[];
}

export function ReviewQueue({
  pendingCreatives,
  pendingListings,
}: ReviewQueueProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Tabs defaultValue="creatives">
      <TabsList>
        <TabsTrigger value="creatives">
          Creatives ({pendingCreatives.length})
        </TabsTrigger>
        <TabsTrigger value="listings">
          Listings ({pendingListings.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="creatives" className="mt-8 space-y-4">
        {pendingCreatives.length === 0 ? (
          <p className="text-muted-foreground">No pending creatives.</p>
        ) : (
          pendingCreatives.map((creative) => (
            <div
              key={creative.id}
              className="flex flex-col gap-4 rounded-xl border border-white/8 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="font-heading text-lg font-semibold">
                  {creative.display_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {[creative.city, creative.province].filter(Boolean).join(", ")}
                </p>
                <StatusBadge status={creative.status} className="mt-2" />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={pending}
                  variant="accent"
                  onClick={() =>
                    startTransition(() => approveCreativeAction(creative.id))
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() =>
                      rejectCreativeAction(creative.id, "Does not meet curation standards")
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="listings" className="mt-8 space-y-4">
        {pendingListings.length === 0 ? (
          <p className="text-muted-foreground">No pending listings.</p>
        ) : (
          pendingListings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-4 rounded-xl border border-white/8 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="font-heading text-lg font-semibold">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {listing.creatives?.display_name} · {listing.categories?.name}
                </p>
                <StatusBadge status={listing.status} className="mt-2" />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={pending}
                  variant="accent"
                  onClick={() =>
                    startTransition(() => approveListingAction(listing.id))
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() =>
                      rejectListingAction(listing.id, "Does not meet listing standards")
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
