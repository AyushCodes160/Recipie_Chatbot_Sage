import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type ChatMessage = { role: "user" | "assistant"; content: string };

type RecipeRow = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  picture_link: string | null;
  num_steps: number;
  num_ingredients: number;
  rank: number;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY!;

const GATEWAY_URL = process.env.AI_GATEWAY_URL || "https://api.openai.com/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Step 1: ask the LLM to extract a search query + numeric filters from the conversation */
async function planRetrieval(history: ChatMessage[]): Promise<{
  search: string;
  max_steps: number | null;
  max_ingredients: number | null;
  needs_recipes: boolean;
}> {
  const planRes = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You convert a user's latest message (with conversation context) into recipe search parameters. " +
            "Always call the `plan_recipe_search` tool. " +
            "Set needs_recipes=false ONLY for pure chitchat or follow-up clarifications that don't require new recipe lookups (e.g. 'thanks', 'tell me more about the first one'). " +
            "Build `search` as a short keyword query (ingredients + dish type). Resolve pronouns/follow-ups using earlier turns. " +
            "IMPORTANT: DO NOT include words like 'recipe', 'recipes', 'how to make', or 'I want'. ONLY output the core food/ingredient keywords (e.g. 'chicken', 'pasta', 'chocolate cake'). " +
            "Set max_steps when the user asks for quick / few-step / easy meals. Set max_ingredients when they want simple/minimal recipes.",
        },
        ...history.slice(-8),
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "plan_recipe_search",
            description: "Plan how to search the recipe database.",
            parameters: {
              type: "object",
              properties: {
                needs_recipes: { type: "boolean" },
                search: { type: "string", description: "Keyword query: ingredients, cuisine, dish type" },
                max_steps: { type: ["integer", "null"], description: "Max cooking steps if user wants quick/easy" },
                max_ingredients: { type: ["integer", "null"], description: "Max ingredients if user wants simple" },
              },
              required: ["needs_recipes", "search"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "plan_recipe_search" } },
    }),
  });

  if (!planRes.ok) {
    const t = await planRes.text();
    console.error("plan error", planRes.status, t);
    return { search: history[history.length - 1]?.content ?? "", max_steps: null, max_ingredients: null, needs_recipes: true };
  }

  const planJson = await planRes.json();
  const args = planJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try {
    const parsed = JSON.parse(args ?? "{}");
    return {
      search: String(parsed.search || ""),
      max_steps: parsed.max_steps ?? null,
      max_ingredients: parsed.max_ingredients ?? null,
      needs_recipes: parsed.needs_recipes !== false,
    };
  } catch {
    return { search: history[history.length - 1]?.content ?? "", max_steps: null, max_ingredients: null, needs_recipes: true };
  }
}

async function searchRecipes(
  search: string,
  max_steps: number | null,
  max_ingredients: number | null,
): Promise<RecipeRow[]> {
  if (!search.trim()) return [];
  const sb = admin();
  const { data, error } = await sb.rpc("search_recipes", {
    query_text: search,
    max_steps,
    max_ingredients,
    match_limit: 6,
  });
  if (error) {
    console.error("search_recipes error", error);
    return [];
  }
  return (data as RecipeRow[]) ?? [];
}

function buildContext(recipes: RecipeRow[]): string {
  if (!recipes.length) return "No matching recipes were found in the database.";
  return recipes
    .map((r, i) => {
      const ings = r.ingredients.slice(0, 20).map((x) => `  - ${x}`).join("\n");
      return `### Recipe ${i + 1} — ${r.title} [id:${r.id}]
Steps: ${r.num_steps} | Ingredients: ${r.num_ingredients}
Ingredients:
${ings}
Instructions:
${r.instructions.slice(0, 1200)}`;
    })
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are **Sage**, a friendly recipe assistant.

You help users find and cook recipes from a database of 125,000 recipes scraped from Food Network, Epicurious, and AllRecipes.

Rules:
- Ground every recipe recommendation in the "Retrieved recipes" context below. NEVER invent recipes that aren't there.
- When the context is empty or irrelevant, say so honestly and ask a clarifying question.
- Use **markdown**: bold recipe names, bullet ingredients, numbered steps.
- When the user asks for "quick" / "few steps" / "simple", prefer recipes with fewer steps/ingredients from the context.
- Reference recipes by their title; do not show internal IDs to the user.
- Keep responses focused — usually suggest 1–3 recipes unless the user asks for more.
- Use prior conversation turns to interpret follow-ups (e.g. "the second one", "make it vegetarian").
- Be warm and concise. End with a short follow-up question when natural.`;

async function streamAnswer(
  history: ChatMessage[],
  recipes: RecipeRow[],
): Promise<Response> {
  const contextBlock = buildContext(recipes);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Retrieved recipes (use these as your source of truth):\n\n${contextBlock}`,
    },
    ...history,
  ];

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, text);
    return new Response(JSON.stringify({ error: text || "AI gateway error" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Wrap the upstream stream and prepend a metadata SSE event with the cited recipes.
  const meta =
    "data: " +
    JSON.stringify({
      type: "recipes",
      recipes: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        picture_link: r.picture_link,
        num_steps: r.num_steps,
        num_ingredients: r.num_ingredients,
      })),
    }) +
    "\n\n";

  const encoder = new TextEncoder();
  const upstream = res.body!;
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(meta));
      const reader = upstream.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const history = (body?.messages ?? []) as ChatMessage[];
          const conversationId = body?.conversation_id as string | undefined;

          if (!Array.isArray(history) || history.length === 0) {
            return new Response(JSON.stringify({ error: "messages[] required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          // Cap history length to control prompt size
          const trimmed = history.slice(-12);

          const plan = await planRetrieval(trimmed);
          const recipes = plan.needs_recipes
            ? await searchRecipes(plan.search, plan.max_steps, plan.max_ingredients)
            : [];

          // Persist the user message asynchronously (non-blocking for streaming)
          if (conversationId) {
            const sb = admin();
            const lastUser = trimmed[trimmed.length - 1];
            if (lastUser?.role === "user") {
              sb.from("chat_messages")
                .insert({
                  conversation_id: conversationId,
                  role: "user",
                  content: lastUser.content,
                })
                .then(() => {});
            }
          }

          return await streamAnswer(trimmed, recipes);
        } catch (err) {
          console.error("chat handler error", err);
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
