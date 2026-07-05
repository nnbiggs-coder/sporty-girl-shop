import type { AssistantToolName } from "./definitions";
import { searchListings } from "./searchListings";
import { getUserWatchlist } from "./getUserWatchlist";
import { getUserSavedSearches } from "./getUserSavedSearches";
import { getCategoryPolicy } from "./getCategoryPolicy";
import { getListingDetails } from "./getListingDetails";

export async function executeTool(
  name: AssistantToolName,
  args: Record<string, unknown>,
  userId: string | null
): Promise<unknown> {
  switch (name) {
    case "searchListings":
      return searchListings(args as Parameters<typeof searchListings>[0]);

    case "getUserWatchlist":
      if (!userId) {
        return {
          error: "not_authenticated",
          message: "User must sign in to view their watchlist.",
        };
      }
      return getUserWatchlist(userId);

    case "getUserSavedSearches":
      if (!userId) {
        return {
          error: "not_authenticated",
          message: "User must sign in to view saved searches.",
        };
      }
      return getUserSavedSearches(userId);

    case "getCategoryPolicy":
      return getCategoryPolicy(args as Parameters<typeof getCategoryPolicy>[0]);

    case "getListingDetails":
      return getListingDetails(String(args.listing_id ?? ""));

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export function getToolStatusLabel(name: AssistantToolName): string {
  const labels: Record<AssistantToolName, string> = {
    searchListings: "Searching listings…",
    getUserWatchlist: "Checking your watchlist…",
    getUserSavedSearches: "Checking saved searches…",
    getCategoryPolicy: "Looking up category policy…",
    getListingDetails: "Fetching listing details…",
  };
  return labels[name];
}
