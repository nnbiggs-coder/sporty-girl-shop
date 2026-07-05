import type { ConditionTier } from "@/lib/config";
import type { ConditionScorecard } from "@/types";
import { aiConfig } from "@/lib/config";

const SCORECARD_SYSTEM_PROMPT = `You are a cosmetic condition assessor for a premium sports equipment resale marketplace.

IMPORTANT CONSTRAINTS:
- You assess ONLY visible/cosmetic wear from photos. You are NOT performing safety inspection.
- You are NOT certifying authenticity. Do not claim an item is genuine or counterfeit.
- Never use language implying safety certification, structural integrity approval, or authenticity verification.
- Output a condition tier and visible wear description only.

Condition tiers (use exactly these labels):
- Pristine: Like new, no visible wear
- Excellent: Minimal visible wear, fully functional appearance
- Very Good: Light visible wear, still presents well
- Good: Noticeable wear but usable condition

Respond with JSON only:
{
  "condition_tier": "Pristine" | "Excellent" | "Very Good" | "Good",
  "visible_wear_notes": "Brief description of visible wear observed",
  "flagged_concerns": ["array of cosmetic concerns visible in photos, if any"]
}`;

export async function generateConditionScorecard(
  photoUrls: string[],
  itemDescription: string
): Promise<ConditionScorecard> {
  if (aiConfig.provider === "anthropic" && aiConfig.anthropicApiKey) {
    return generateWithAnthropic(photoUrls, itemDescription);
  }

  if (aiConfig.openaiApiKey) {
    return generateWithOpenAI(photoUrls, itemDescription);
  }

  // Fallback for dev without API keys — clearly labeled as mock
  return mockScorecard(itemDescription);
}

async function generateWithOpenAI(
  photoUrls: string[],
  itemDescription: string
): Promise<ConditionScorecard> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: "text",
      text: `Assess the visible/cosmetic condition of this sports item: ${itemDescription}. This is a cosmetic assessment only — not safety or authenticity.`,
    },
    ...photoUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiConfig.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SCORECARD_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return validateScorecard(parsed);
}

async function generateWithAnthropic(
  photoUrls: string[],
  itemDescription: string
): Promise<ConditionScorecard> {
  const content = [
    {
      type: "text",
      text: `Assess the visible/cosmetic condition of this sports item: ${itemDescription}. This is a cosmetic assessment only — not safety or authenticity.`,
    },
    ...photoUrls.map((url) => ({
      type: "image",
      source: { type: "url", url },
    })),
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": aiConfig.anthropicApiKey!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SCORECARD_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Anthropic response");
  return validateScorecard(JSON.parse(jsonMatch[0]));
}

function validateScorecard(raw: Record<string, unknown>): ConditionScorecard {
  const tiers: ConditionTier[] = ["Pristine", "Excellent", "Very Good", "Good"];
  const tier = tiers.includes(raw.condition_tier as ConditionTier)
    ? (raw.condition_tier as ConditionTier)
    : "Good";

  return {
    condition_tier: tier,
    visible_wear_notes: String(raw.visible_wear_notes ?? "Condition assessed from submitted photos."),
    flagged_concerns: Array.isArray(raw.flagged_concerns)
      ? raw.flagged_concerns.map(String)
      : [],
  };
}

function mockScorecard(itemDescription: string): ConditionScorecard {
  return {
    condition_tier: "Very Good",
    visible_wear_notes: `[Dev mock] Visible wear assessment for: ${itemDescription}. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY for live AI scorecard.`,
    flagged_concerns: [],
  };
}
