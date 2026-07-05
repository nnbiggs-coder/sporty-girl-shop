"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, Textarea } from "@/components/ui/Input";
import { PHOTO_REQUIREMENTS } from "@/lib/config";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { formatPrice } from "@/lib/utils";
import type { Category, ConditionScorecard } from "@/types";
import type { ConditionTier } from "@/lib/config";
import Image from "next/image";

type Step = "details" | "photos" | "safety" | "scorecard" | "pricing" | "review";

interface PriceSuggestion {
  min: number;
  max: number;
  suggested: number;
  comparables: Array<{
    title: string;
    sold_price: number;
    condition_tier: string;
    source: string;
  }>;
}

export default function SellPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("details");
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [size, setSize] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  // Safety disclosure
  const [hasImpact, setHasImpact] = useState<boolean | null>(null);
  const [impactDescription, setImpactDescription] = useState("");
  const [hasStructuralDamage, setHasStructuralDamage] = useState<boolean | null>(null);
  const [structuralDescription, setStructuralDescription] = useState("");
  const [attestsAccuracy, setAttestsAccuracy] = useState(false);

  // AI results
  const [scorecard, setScorecard] = useState<ConditionScorecard | null>(null);
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const requiresSafety = selectedCategory?.requires_safety_disclosure ?? false;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/sell");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tos_accepted_at")
        .eq("id", user.id)
        .single();

      if (!profile?.tos_accepted_at) {
        router.push("/accept-tos?redirect=/sell");
        return;
      }

      const { data: cats } = await supabase.from("categories").select("*").order("sport").order("name");
      setCategories(cats ?? []);
    }
    init();
  }, [supabase, router]);

  async function handlePhotoUpload(key: string, file: File) {
    setUploading(key);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${listingId ?? "draft"}/${key}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-media")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("listing-media").getPublicUrl(path);
    setPhotos((prev) => ({ ...prev, [key]: publicUrl }));
    setUploading(null);
  }

  async function createDraftListing() {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !categoryId) return;

    const category = categories.find((c) => c.id === categoryId);
    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        category_id: categoryId,
        title,
        brand: brand || null,
        sport: category?.sport ?? "",
        size: size || null,
        fee_tier: category?.fee_tier ?? "commodity",
        status: "draft",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setListingId(data.id);
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "listing_created",
        userId: user.id,
        listingId: data.id,
        categoryId,
      }),
    });

    setLoading(false);
    setStep("photos");
  }

  async function savePhotosAndContinue() {
    if (!listingId) return;
    const photoArray = PHOTO_REQUIREMENTS.map((req) => ({
      key: req.key,
      url: photos[req.key],
      uploaded_at: new Date().toISOString(),
    })).filter((p) => p.url);

    await supabase.from("listings").update({ photos: photoArray }).eq("id", listingId);

    if (requiresSafety) {
      setStep("safety");
    } else {
      await runAiPipeline();
    }
  }

  async function saveSafetyAndContinue() {
    if (!listingId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const disclosure = {
      has_been_in_impact: hasImpact!,
      impact_description: impactDescription || undefined,
      has_structural_damage: hasStructuralDamage!,
      structural_damage_description: structuralDescription || undefined,
      seller_attests_accuracy: attestsAccuracy,
    };

    await supabase.from("safety_disclosures").insert({
      listing_id: listingId,
      user_id: user.id,
      ...disclosure,
    });

    await supabase.from("listings").update({ safety_disclosure: disclosure }).eq("id", listingId);
    await runAiPipeline();
  }

  async function runAiPipeline() {
    setLoading(true);
    setError("");
    setStep("scorecard");

    try {
      const res = await fetch("/api/ai/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          photoUrls: Object.values(photos),
          itemDescription: `${brand} ${title}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate scorecard");
      const data = await res.json();
      setScorecard(data.scorecard);
      setPriceSuggestion(data.priceSuggestion);
      if (data.priceSuggestion?.suggested) {
        setPrice(data.priceSuggestion.suggested);
      }
      setStep("pricing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI pipeline failed");
    }
    setLoading(false);
  }

  async function publishListing() {
    if (!listingId || !price || !scorecard) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("listings").update({
      price,
      condition_tier: scorecard.condition_tier,
      ai_notes: scorecard.visible_wear_notes,
      flagged_concerns: scorecard.flagged_concerns,
      suggested_price_min: priceSuggestion?.min ?? null,
      suggested_price_max: priceSuggestion?.max ?? null,
      status: "live",
      published_at: new Date().toISOString(),
      ai_scorecard_generated_at: new Date().toISOString(),
    }).eq("id", listingId);

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "listing_published",
        userId: user?.id,
        listingId,
        categoryId,
      }),
    });

    await fetch("/api/notifications/match-saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    setLoading(false);
    router.push(`/listings/${listingId}`);
  }

  const allPhotosUploaded = PHOTO_REQUIREMENTS.every((req) => photos[req.key]);
  const safetyComplete =
    hasImpact !== null &&
    hasStructuralDamage !== null &&
    attestsAccuracy;

  return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Sell an Item</h1>

        {/* Step indicator */}
        <div className="mt-4 flex gap-1">
          {(["details", "photos", ...(requiresSafety ? ["safety"] : []), "scorecard", "pricing", "review"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${step === s ? "bg-brand-600" : "bg-border"}`}
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {step === "details" && (
          <div className="mt-8 space-y-4">
            <div>
              <Label htmlFor="title">Item Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" placeholder="e.g. Nike Mercurial Vapor 15 FG" />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1" placeholder="e.g. Nike" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.sport} — {c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} className="mt-1" placeholder="e.g. 7, M, 17&quot;" />
            </div>
            <Button onClick={createDraftListing} disabled={!title || !categoryId || loading}>
              Continue to Photos
            </Button>
          </div>
        )}

        {step === "photos" && (
          <div className="mt-8 space-y-6">
            <p className="text-sm text-text-muted">Upload all 4 required photos for AI condition assessment.</p>
            {PHOTO_REQUIREMENTS.map((req) => (
              <div key={req.key} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text">{req.label}</p>
                    <p className="text-xs text-text-muted">{req.description}</p>
                  </div>
                  {photos[req.key] ? (
                    <span className="text-xs text-emerald-600 font-medium">Uploaded ✓</span>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(req.key, file);
                        }}
                      />
                      <span className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium cursor-pointer hover:bg-surface-muted">
                        {uploading === req.key ? "Uploading..." : "Upload"}
                      </span>
                    </label>
                  )}
                </div>
                {photos[req.key] && (
                  <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-lg">
                    <Image src={photos[req.key]} alt={req.label} fill className="object-cover" />
                  </div>
                )}
              </div>
            ))}
            <Button onClick={savePhotosAndContinue} disabled={!allPhotosUploaded || loading}>
              {requiresSafety ? "Continue to Safety Disclosure" : "Generate AI Scorecard"}
            </Button>
          </div>
        )}

        {step === "safety" && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Safety Disclosure Required</p>
              <p className="mt-1 text-xs text-amber-700">
                This category requires you to disclose any impact, crash, or structural damage history.
                This is separate from the AI cosmetic condition assessment and is required by platform policy.
              </p>
            </div>

            <div>
              <Label>Has this item ever been in a fall, impact, or crash?</Label>
              <div className="mt-2 flex gap-3">
                <Button variant={hasImpact === true ? "primary" : "outline"} size="sm" onClick={() => setHasImpact(true)}>Yes</Button>
                <Button variant={hasImpact === false ? "primary" : "outline"} size="sm" onClick={() => setHasImpact(false)}>No</Button>
              </div>
              {hasImpact && (
                <Textarea
                  value={impactDescription}
                  onChange={(e) => setImpactDescription(e.target.value)}
                  placeholder="Describe the incident..."
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label>Does this item have any structural damage (cracks, dents, compromised integrity)?</Label>
              <div className="mt-2 flex gap-3">
                <Button variant={hasStructuralDamage === true ? "primary" : "outline"} size="sm" onClick={() => setHasStructuralDamage(true)}>Yes</Button>
                <Button variant={hasStructuralDamage === false ? "primary" : "outline"} size="sm" onClick={() => setHasStructuralDamage(false)}>No</Button>
              </div>
              {hasStructuralDamage && (
                <Textarea
                  value={structuralDescription}
                  onChange={(e) => setStructuralDescription(e.target.value)}
                  placeholder="Describe the damage..."
                  className="mt-2"
                />
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestsAccuracy}
                onChange={(e) => setAttestsAccuracy(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-text">
                I attest that the above safety disclosures are accurate and complete to the best of my knowledge.
              </span>
            </label>

            <Button onClick={saveSafetyAndContinue} disabled={!safetyComplete || loading}>
              Continue to AI Scorecard
            </Button>
          </div>
        )}

        {(step === "scorecard" || step === "pricing") && loading && (
          <div className="mt-12 text-center">
            <p className="text-text-muted">Generating AI condition scorecard...</p>
          </div>
        )}

        {step === "pricing" && scorecard && !loading && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-semibold text-text">AI Condition Scorecard</h2>
              <p className="mt-1 text-xs text-text-muted">
                Cosmetic/visible-wear assessment only — not a safety inspection or authenticity certification.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <ConditionBadge tier={scorecard.condition_tier as ConditionTier} />
              </div>
              <p className="mt-3 text-sm text-text">{scorecard.visible_wear_notes}</p>
              {scorecard.flagged_concerns.length > 0 && (
                <ul className="mt-2 text-sm text-amber-700 list-disc pl-5">
                  {scorecard.flagged_concerns.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
            </div>

            {priceSuggestion && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="font-semibold text-text">Suggested Price</h2>
                <p className="mt-2 text-2xl font-bold text-text">
                  {formatPrice(priceSuggestion.suggested)}
                  <span className="text-sm font-normal text-text-muted ml-2">
                    (range: {formatPrice(priceSuggestion.min)} – {formatPrice(priceSuggestion.max)})
                  </span>
                </p>
                {priceSuggestion.comparables.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Based on comparable sales</p>
                    <ul className="mt-2 space-y-1">
                      {priceSuggestion.comparables.slice(0, 5).map((c, i) => (
                        <li key={i} className="text-sm text-text-muted flex justify-between">
                          <span>{c.title} ({c.condition_tier})</span>
                          <span>{formatPrice(c.sold_price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="price">Your Price</Label>
              <Input
                id="price"
                type="number"
                value={price ?? ""}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="mt-1"
                min={1}
                step={0.01}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => { setApproved(true); setStep("review"); }} disabled={!price}>
                Approve & Review
              </Button>
              <Button variant="outline" onClick={() => { setApproved(false); router.push("/dashboard"); }}>
                Decline & Save Draft
              </Button>
            </div>
          </div>
        )}

        {step === "review" && approved && scorecard && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-semibold text-text">Review Your Listing</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-text-muted">Title</dt><dd className="text-text">{title}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Brand</dt><dd className="text-text">{brand || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Condition</dt><dd><ConditionBadge tier={scorecard.condition_tier as ConditionTier} /></dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Price</dt><dd className="font-semibold text-text">{formatPrice(price)}</dd></div>
              </dl>
            </div>
            <Button onClick={publishListing} disabled={loading} size="lg" className="w-full">
              {loading ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        )}
      </div>
  );
}
