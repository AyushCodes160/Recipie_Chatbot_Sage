import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChefHat, Send, Sparkles, Clock, Soup, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  recipes?: RecipeRef[];
};

export type RecipeRef = {
  id: string;
  title: string;
  picture_link: string | null;
  num_steps: number;
  num_ingredients: number;
};

const SUGGESTIONS = [
  "A quick chicken tenders recipe with few steps",
  "Comforting vegetarian pasta for a cold night",
  "Something with shrimp and garlic, under 30 minutes",
  "An easy chocolate dessert with simple ingredients",
];

export function RecipeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  async function send(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
        signal: ctrl.signal,
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        throw new Error(errText || `Request failed: ${resp.status}`);
      }

      // Add empty assistant placeholder
      setMessages((prev) => [...prev, { role: "assistant", content: "", recipes: [] }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      let recipes: RecipeRef[] = [];

      const updateLast = (patch: Partial<ChatMessage>) => {
        setMessages((prev) => {
          const out = [...prev];
          const last = out[out.length - 1];
          if (last && last.role === "assistant") {
            out[out.length - 1] = { ...last, ...patch };
          }
          return out;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const obj = JSON.parse(payload);
            if (obj?.type === "recipes") {
              recipes = obj.recipes ?? [];
              updateLast({ recipes });
              continue;
            }
            const delta = obj?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              assistantText += delta;
              updateLast({ content: assistantText });
            }
          } catch {
            // partial line — push it back
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error("chat stream failed", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry — I couldn't reach the recipe service. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-warm shadow-warm flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold tracking-tight leading-none">
              Sage
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              your recipe companion · 5,000 dishes
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>RAG · Gemini</span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {messages.length === 0 ? (
          <Welcome onPick={(t) => send(t)} />
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} isLast={i === messages.length - 1} streaming={isStreaming} />
            ))}
            {isStreaming &&
              messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  searching the cookbook…
                </div>
              )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border bg-background/80 backdrop-blur p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 bg-card border border-border rounded-3xl p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring/40 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask for a recipe… e.g. 'chicken tenders, few steps'"
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground max-h-40"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-warm text-primary-foreground flex items-center justify-center shadow-warm transition hover:scale-105 disabled:opacity-40 disabled:scale-100"
            aria-label="Send"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Sage remembers this chat and grounds answers in real recipes.
        </p>
      </form>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
      <div className="w-16 h-16 rounded-3xl bg-gradient-warm shadow-warm flex items-center justify-center mb-5">
        <ChefHat className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <h2 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">
        What's cooking today?
      </h2>
      <p className="text-muted-foreground mt-3 max-w-md">
        Tell me what you have, how much time you've got, or what you're craving.
        I'll dig through 5,000 recipes from Food Network, Epicurious & AllRecipes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition text-sm leading-snug"
          >
            <span className="text-foreground group-hover:text-primary transition">
              {s}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isLast,
  streaming,
}: {
  message: ChatMessage;
  isLast: boolean;
  streaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-primary text-primary-foreground rounded-3xl rounded-tr-md px-4 py-2.5 shadow-warm">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-2xl bg-accent/30 border border-accent/40 flex items-center justify-center mt-0.5">
        <ChefHat className="w-4.5 h-4.5 text-primary" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        {message.recipes && message.recipes.length > 0 && (
          <RecipeStrip recipes={message.recipes} />
        )}
        <div
          className={cn(
            "prose prose-sm max-w-none text-foreground",
            "prose-headings:font-display prose-headings:font-semibold prose-headings:text-foreground",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2",
            "prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
          )}
        >
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : isLast && streaming ? (
            <div className="inline-flex gap-1 items-center text-muted-foreground py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RecipeStrip({ recipes }: { recipes: RecipeRef[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1 snap-x">
      {recipes.map((r) => (
        <div
          key={r.id}
          className="snap-start shrink-0 w-56 rounded-2xl border border-border bg-card overflow-hidden shadow-soft"
        >
          {r.picture_link ? (
            <div
              className="h-24 bg-cover bg-center bg-secondary"
              style={{ backgroundImage: `url(${r.picture_link})` }}
            />
          ) : (
            <div className="h-24 bg-gradient-warm flex items-center justify-center">
              <Soup className="w-7 h-7 text-primary-foreground/80" />
            </div>
          )}
          <div className="p-3">
            <h4 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
              {r.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {r.num_steps} {r.num_steps === 1 ? "step" : "steps"}
              </span>
              <span className="flex items-center gap-1">
                <Soup className="w-3 h-3" />
                {r.num_ingredients} ing.
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
