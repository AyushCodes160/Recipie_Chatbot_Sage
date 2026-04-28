import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Clock, Soup, Loader2, ArrowLeft, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useSearch } from "@tanstack/react-router";

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
  { text: "A quick chicken tenders recipe with few steps", emoji: "🍗" },
  { text: "Comforting vegetarian pasta for a cold night", emoji: "🍝" },
  { text: "Something with shrimp and garlic, under 30 minutes", emoji: "🍤" },
  { text: "An easy chocolate dessert with simple ingredients", emoji: "🍫" },
];

export function RecipeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialQueryRef = useRef(false);
  const search = useSearch({ strict: false }) as { q?: string };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Auto-trigger search if 'q' parameter is present
  useEffect(() => {
    if (search.q && !initialQueryRef.current) {
      initialQueryRef.current = true;
      send(`Show me some ${search.q} recipes`);
    }
  }, [search.q]);

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
    <div className="flex flex-col h-[100dvh] max-w-4xl mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b-2 border-[#E8CCAB] bg-[#FDF0E0]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-white border-2 border-[#E8CCAB] flex items-center justify-center hover:border-[#D94F30]/40 hover:shadow-soft transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#5C3420]" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-gradient-hero shadow-warm flex items-center justify-center">
            <span className="text-xl">🍳</span>
          </div>
          <div>
            <h1 className="text-xl font-display tracking-wide leading-none text-[#2D1810]">
              Sage
            </h1>
            <p className="text-xs text-[#8B6B50] mt-0.5 font-medium">
              your recipe companion · 125K dishes
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8B6B50] bg-[#D94F30]/10 px-3 py-1.5 rounded-full border border-[#D94F30]/20">
          <Flame className="w-3.5 h-3.5 text-[#D94F30]" />
          <span className="font-semibold text-[#D94F30]">RAG · Llama 3.1</span>
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
                <div className="flex items-center gap-2 text-[#8B6B50] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D94F30]" />
                  <span className="font-hand text-lg">searching the cookbook…</span>
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
        className="border-t-2 border-[#E8CCAB] bg-[#FDF0E0]/80 backdrop-blur-xl p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 bg-white border-2 border-[#E8CCAB] rounded-2xl p-2 shadow-soft focus-within:border-[#D94F30]/50 focus-within:shadow-warm transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask for a recipe… e.g. 'chicken tenders, few steps' 🍗"
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[#B8957A] max-h-40 text-[#2D1810]"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-11 h-11 rounded-xl bg-gradient-hero text-white flex items-center justify-center shadow-warm transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:scale-100"
            aria-label="Send"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="text-[11px] text-[#B8957A] text-center mt-2 font-hand text-base">
          Sage remembers this chat and grounds answers in real recipes 🍳
        </p>
      </form>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
      {/* Decorative food emojis */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-hero shadow-warm flex items-center justify-center animate-pulse-glow">
          <span className="text-4xl">🍳</span>
        </div>
        <span className="absolute -top-2 -right-4 text-3xl animate-float">🍕</span>
        <span className="absolute -bottom-1 -left-5 text-2xl animate-float-reverse">🍔</span>
      </div>

      <h2 className="font-display text-4xl sm:text-5xl text-[#2D1810] tracking-wide">
        What's <span className="text-[#D94F30]">Cooking</span> Today?
      </h2>
      <p className="text-[#8B6B50] mt-3 max-w-md text-base leading-relaxed">
        Tell me what you have, how much time you've got, or what you're craving.
        I'll dig through <span className="font-semibold text-[#D94F30]">125,000 recipes</span> from Food Network, Epicurious & AllRecipes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onPick(s.text)}
            className="group text-left p-4 rounded-2xl bg-white/80 border-2 border-[#E8CCAB] hover:border-[#D94F30]/40 hover:shadow-card transition-all text-sm leading-snug"
          >
            <span className="text-2xl block mb-2">{s.emoji}</span>
            <span className="text-[#5C3420] group-hover:text-[#D94F30] transition font-medium">
              {s.text}
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
        <div className="max-w-[85%] bg-gradient-hero text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-warm">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-[#F2A93B]/20 border-2 border-[#F2A93B]/30 flex items-center justify-center mt-0.5">
        <span className="text-lg">🍳</span>
      </div>
      <div className="flex-1 min-w-0">
        {message.recipes && message.recipes.length > 0 && (
          <RecipeStrip recipes={message.recipes} />
        )}
        <div
          className={cn(
            "prose prose-sm max-w-none text-[#2D1810]",
            "prose-headings:font-display prose-headings:font-normal prose-headings:text-[#2D1810] prose-headings:tracking-wide",
            "prose-strong:text-[#D94F30] prose-strong:font-semibold",
            "prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2",
            "prose-code:text-[#D94F30] prose-code:bg-[#F5DFC5] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none",
          )}
        >
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : isLast && streaming ? (
            <div className="inline-flex gap-1.5 items-center text-[#D94F30] py-2">
              <span className="w-2 h-2 rounded-full bg-[#D94F30] animate-pulse" />
              <span
                className="w-2 h-2 rounded-full bg-[#D94F30] animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[#D94F30] animate-pulse"
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
    <div className="flex gap-3 overflow-x-auto pb-3 mb-2 -mx-1 px-1 snap-x">
      {recipes.map((r) => (
        <div
          key={r.id}
          className="snap-start shrink-0 w-60 rounded-2xl border-2 border-[#E8CCAB] bg-white overflow-hidden shadow-card hover:shadow-lg hover:border-[#D94F30]/30 transition-all hover:scale-[1.02]"
        >
          {r.picture_link ? (
            <div
              className="h-28 bg-cover bg-center bg-[#F5DFC5]"
              style={{ backgroundImage: `url(${r.picture_link})` }}
            />
          ) : (
            <div className="h-28 bg-gradient-hero flex items-center justify-center">
              <span className="text-4xl">🍲</span>
            </div>
          )}
          <div className="p-3">
            <h4 className="text-sm font-bold leading-snug line-clamp-2 min-h-[2.5rem] text-[#2D1810]">
              {r.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8B6B50] font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D94F30]" />
                {r.num_steps} {r.num_steps === 1 ? "step" : "steps"}
              </span>
              <span className="flex items-center gap-1">
                <Soup className="w-3 h-3 text-[#F2A93B]" />
                {r.num_ingredients} ing.
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
