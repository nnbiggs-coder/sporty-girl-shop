import { aiConfig } from "@/lib/config";
import type { AssistantMessage, AssistantStreamEvent } from "../tools/definitions";
import { ASSISTANT_TOOLS, MAX_TOOL_ROUNDS } from "../tools/definitions";
import { buildAssistantSystemPrompt } from "../systemPrompt";
import { executeTool, getToolStatusLabel } from "../tools/executor";
import type { ToolCallRequest } from "../tools/definitions";

const ANTHROPIC_MODEL = process.env.ASSISTANT_MODEL ?? "claude-sonnet-4-20250514";

const anthropicTools = ASSISTANT_TOOLS.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

export async function* runAnthropicAssistant(
  history: AssistantMessage[],
  userId: string | null
): AsyncGenerator<AssistantStreamEvent> {
  if (!aiConfig.anthropicApiKey) {
    yield {
      type: "error",
      content: "Assistant unavailable — configure ANTHROPIC_API_KEY.",
    };
    yield { type: "done" };
    return;
  }

  type AnthropicMessage = {
    role: "user" | "assistant";
    content: unknown;
  };

  const messages: AnthropicMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": aiConfig.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: buildAssistantSystemPrompt(),
        messages,
        tools: anthropicTools,
      }),
    });

    if (!response.ok) {
      yield { type: "error", content: await response.text() };
      yield { type: "done" };
      return;
    }

    const data = await response.json();
    const contentBlocks = data.content ?? [];

    const toolUseBlocks = contentBlocks.filter(
      (b: { type: string }) => b.type === "tool_use"
    );
    const textBlocks = contentBlocks.filter(
      (b: { type: string }) => b.type === "text"
    );

    if (toolUseBlocks.length > 0) {
      messages.push({ role: "assistant", content: contentBlocks });

      const toolResults = [];
      for (const block of toolUseBlocks) {
        const name = block.name as ToolCallRequest["name"];
        yield { type: "tool_start", tool: name, content: getToolStatusLabel(name) };

        const result = await executeTool(name, block.input ?? {}, userId);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });

        yield { type: "tool_end", tool: name };
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Stream final text response
    const streamResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": aiConfig.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: buildAssistantSystemPrompt(),
        messages,
        stream: true,
      }),
    });

    if (!streamResponse.ok || !streamResponse.body) {
      const fallback = textBlocks.map((b: { text: string }) => b.text).join("");
      if (fallback) yield { type: "token", content: fallback };
      yield { type: "done" };
      return;
    }

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          if (
            parsed.type === "content_block_delta" &&
            parsed.delta?.type === "text_delta"
          ) {
            yield { type: "token", content: parsed.delta.text };
          }
        } catch {
          // skip
        }
      }
    }

    yield { type: "done" };
    return;
  }

  yield {
    type: "token",
    content:
      "I've reached my search limit for this question. Could you narrow it down?",
  };
  yield { type: "done" };
}
