import { createClient } from "@/lib/supabase/server";
import { runAssistant } from "@/lib/assistant/runAssistant";
import type { AssistantMessage } from "@/lib/assistant/tools/definitions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: { messages?: AssistantMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of runAssistant(messages, user?.id ?? null)) {
          controller.enqueue(encoder.encode(encodeSSE(event.type, event)));
          if (event.type === "done" || event.type === "error") break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Assistant failed";
        controller.enqueue(encoder.encode(encodeSSE("error", { type: "error", content: msg })));
        controller.enqueue(encoder.encode(encodeSSE("done", { type: "done" })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
