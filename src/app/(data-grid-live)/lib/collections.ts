import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/utils";
import { type SkaterSchema, skaterSchema } from "./validation";

const queryClient = new QueryClient();

export const skatersCollection = createCollection(
  queryCollectionOptions({
    id: "skaters",
    queryKey: ["skaters"],
    queryClient,
    queryFn: async (): Promise<SkaterSchema[]> => {
      const response = await fetch(getAbsoluteUrl("/api/skaters"));
      if (!response.ok) {
        throw new Error("Failed to fetch skaters");
      }
      const data = skaterSchema.array().safeParse(await response.json()).data;

      if (!data) {
        throw new Error("Failed to parse skaters");
      }

      return data;
    },
    getKey: (item: SkaterSchema) => item.id,
    schema: skaterSchema,
    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations
        .filter(
          (
            m,
          ): m is typeof m & {
            key: string;
            changes: Partial<SkaterSchema>;
          } => m?.key != null && m?.changes != null,
        )
        .map((m) => ({ id: m.key, changes: m.changes }));

      if (updates.length === 0) return;

      // Use bulk update - optimized for same-changes case
      const response = await fetch(getAbsoluteUrl("/api/skaters"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update skaters");
      }
    },
  }),
);
