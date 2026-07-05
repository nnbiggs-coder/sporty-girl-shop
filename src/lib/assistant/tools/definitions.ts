export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "searchListings",
      description:
        "Search live listings in the marketplace database. Use for product discovery, price browsing, or finding gear by sport/category/condition.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional text search against title and brand",
          },
          sport: { type: "string", description: "Filter by sport name" },
          category_slug: { type: "string", description: "Filter by category slug" },
          min_price: { type: "number" },
          max_price: { type: "number" },
          size: { type: "string" },
          condition_tier: {
            type: "string",
            enum: ["Pristine", "Excellent", "Very Good", "Good"],
          },
          limit: { type: "number", description: "Max results, default 8" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getUserWatchlist",
      description:
        "Get the authenticated user's watchlisted/saved items. Requires login.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getUserSavedSearches",
      description:
        "Get the authenticated user's saved searches with current matching live listing counts. Requires login.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCategoryPolicy",
      description:
        "Look up real category policy: fee tier, platform fee percent, safety disclosure requirement, and condition tier definitions. Use for fee or safety policy questions.",
      parameters: {
        type: "object",
        properties: {
          category_slug: {
            type: "string",
            description: "Category slug, e.g. fencing_kit, helmets, soccer_cleats",
          },
          category_name: {
            type: "string",
            description: "Alternative: search by category display name",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getListingDetails",
      description:
        "Get full details for a specific listing including AI condition scorecard, price, safety disclosure, and seller notes. Use when user asks about a specific item.",
      parameters: {
        type: "object",
        properties: {
          listing_id: {
            type: "string",
            description: "UUID of the listing",
          },
        },
        required: ["listing_id"],
      },
    },
  },
] as const;

export type AssistantToolName =
  | "searchListings"
  | "getUserWatchlist"
  | "getUserSavedSearches"
  | "getCategoryPolicy"
  | "getListingDetails";

export const MAX_TOOL_ROUNDS = 5;

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCallRequest {
  id: string;
  name: AssistantToolName;
  arguments: Record<string, unknown>;
}

export interface AssistantStreamEvent {
  type: "token" | "tool_start" | "tool_end" | "error" | "done";
  content?: string;
  tool?: string;
}
