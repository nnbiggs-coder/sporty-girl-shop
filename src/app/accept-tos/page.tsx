"use client";

import { Suspense } from "react";
import TosAcceptanceContent from "./TosAcceptanceContent";

export default function TosAcceptancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}>
      <TosAcceptanceContent />
    </Suspense>
  );
}
