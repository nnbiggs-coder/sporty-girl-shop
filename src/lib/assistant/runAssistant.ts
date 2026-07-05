import { aiConfig } from "@/lib/config";
import type { AssistantMessage, AssistantStreamEvent, ToolCallRequest } from "./tools/definitions";
import { ASSISTANT_TOOLS, MAX_TOOL_ROUNDS } from "./tools/definitions";
import { buildAssistantSystemPrompt } from "./systemPrompt";
import { executeTool, getToolStatusLabel } from "./tools/executor";
import { runAnthropicAssistant } from "./provider/anthropic";

const OPENAI_MODEL = process.env.ASSISTANT_MODEL ?? "gpt-4o";

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export async function* runAssistant(
  history: AssistantMessage[],
  userId: string | null
): AsyncGenerator<AssistantStreamEvent> {
  if (aiConfig.provider === "anthropic" && aiConfig.anthropicApiKey) {
    yield* runAnthropicAssistant(history, userId);
    return;
  }

  if (!aiConfig.openaiApiKey) {
    yield {
      type: "error",
      content: "Assistant unavailable — configure OPENAI_API_KEY in environment variables.",
    };
    yield { type: "done" };
    return;
  }

  yield* runOpenAIAssistant(history, userId);
}

async function* runOpenAIAssistant(
  history: AssistantMessage[],
  userId: string | null
): AsyncGenerator<AssistantStreamEvent> {
  const messages: OpenAIMessage[] = [
    { role: "system", content: buildAssistantSystemPrompt() },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiConfig.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      yield { type: "error", content: `Assistant error: ${err}` };
      yield { type: "done" };
      return;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      yield { type: "error", content: "Empty response from assistant." };
      yield { type: "done" };
      return;
    }

    if (message.tool_calls?.length) {
      messages.push({
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });

      for (const tc of message.tool_calls) {
        const name = tc.function.name as ToolCallRequest["name"];
        yield { type: "tool_start", tool: name, content: getToolStatusLabel(name) };

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          args = {};
        }

        const result = await executeTool(name, args, userId);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });

        yield { type: "tool_end", tool: name };
      }
      continue;
    }

    // Final response — stream tokens
    const streamResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiConfig.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        stream: true,
      }),
    });

    if (!streamResponse.ok || !streamResponse.body) {
      // Fallback to non-streamed content
      if (message.content) {
        yield { type: "token", content: message.content };
      }
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
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) yield { type: "token", content: token };
        } catch {
          // skip malformed chunks
        }
      }
    }

    yield { type: "done" };
    return;
  }

  yield {
    type: "token",
    content:
      "I've reached my search limit for this question. Could you narrow it down or ask about something specific?",
  };
  yield { type: "done" };
}
