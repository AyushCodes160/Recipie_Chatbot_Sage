import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Search, Clock, Flame, Star, ArrowRight, Utensils, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sage — Your AI Recipe Companion" },
      {
        name: "description",
        content:
          "Discover 125,000+ recipes with Sage, your AI-powered recipe assistant. Search by ingredients, cooking time, or just tell us what you're craving.",
      },
      { property: "og:title", content: "Sage — AI Recipe Companion" },
      {
        property: "og:description",
        content:
          "Find the perfect recipe by chatting. RAG-powered, conversational, and grounded in real cookbooks.",
      },
    ],
  }),
  component: LandingPage,
});

/* ── food image URLs (Unsplash) ── */
const HERO_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80";
const PIZZA_IMG = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80";
const CHICKEN_IMG = "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80";
const PASTA_IMG = "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80";
const DESSERT_IMG = "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80";
const SALAD_IMG = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80";
const TACOS_IMG = "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80";

const CATEGORIES = [
  { name: "Burgers", emoji: "🍔", img: HERO_BURGER, count: "2,400+" },
  { name: "Pizza", emoji: "🍕", img: PIZZA_IMG, count: "1,800+" },
  { name: "Chicken", emoji: "🍗", img: CHICKEN_IMG, count: "5,200+" },
  { name: "Pasta", emoji: "🍝", img: PASTA_IMG, count: "3,100+" },
  { name: "Desserts", emoji: "🍩", img: DESSERT_IMG, count: "4,700+" },
  { name: "Salads", emoji: "🥗", img: SALAD_IMG, count: "1,900+" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Smart Search",
    desc: "Ask in plain English — ingredients, cuisine, dietary needs. Our AI understands it all.",
  },
  {
    icon: Clock,
    title: "Time Filters",
    desc: "Need something quick? Ask for recipes with fewer steps and we'll find the fastest ones.",
  },
  {
    icon: MessageCircle,
    title: "Chat Memory",
    desc: "Sage remembers your conversation. Refine results, ask follow-ups, explore naturally.",
  },
];



function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ═══ Decorative Background Elements ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#D94F30]/8 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 rounded-full bg-[#F2A93B]/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[#D94F30]/5 blur-2xl" />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDF0E0]/80 border-b border-[#E8CCAB]/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-warm">
              <span className="text-2xl">🍳</span>
            </div>
            <div>
              <h1 className="font-display text-2xl text-[#2D1810] leading-none tracking-wide">Sage</h1>
              <p className="text-[11px] text-[#8B6B50] font-medium tracking-wider uppercase">Recipe Assistant</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#categories" className="text-sm font-medium text-[#5C3420] hover:text-[#D94F30] transition">Menu</a>
            <a href="#features" className="text-sm font-medium text-[#5C3420] hover:text-[#D94F30] transition">Features</a>

          </div>

          <Link
            to="/chat"
            className="flex items-center gap-2 bg-[#D94F30] hover:bg-[#C0392B] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-warm hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Now</span>
          </Link>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="relative">
            {/* Decorative dots */}
            <div className="absolute -top-8 -left-6 w-16 h-16 dot-pattern opacity-30 rounded-full" />

            <div className="inline-flex items-center gap-2 bg-[#D94F30]/10 border border-[#D94F30]/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="w-4 h-4 text-[#D94F30]" />
              <span className="text-sm font-semibold text-[#D94F30]">125,000+ Recipes</span>
            </div>

            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#2D1810] leading-[1.05] tracking-wide">
              WHERE{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#D94F30]">GOOD</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8 Q 50 2, 100 8 Q 150 14, 198 6" stroke="#F2A93B" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              FOOD
              <br />
              <span className="text-[#F2A93B]">BEGINS</span>
            </h2>

            <p className="mt-6 text-lg text-[#8B6B50] max-w-lg leading-relaxed">
              Tell Sage what you have, how much time you've got, or what you're craving. 
              Our AI will dig through thousands of real recipes from Food Network, Epicurious & AllRecipes.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to="/chat"
                className="group flex items-center gap-3 bg-gradient-hero text-white px-8 py-4 rounded-full text-lg font-bold shadow-warm hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <span>Start Cooking</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#categories"
                className="flex items-center gap-2 bg-white/70 border-2 border-[#E8CCAB] text-[#5C3420] px-7 py-4 rounded-full text-lg font-bold hover:border-[#D94F30]/40 hover:bg-white transition-all"
              >
                <Utensils className="w-5 h-5" />
                <span>Browse Menu</span>
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { value: "125K+", label: "Recipes" },
                { value: "3", label: "Databases" },
                { value: "AI", label: "Powered" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl text-[#D94F30]">{s.value}</p>
                  <p className="text-xs text-[#8B6B50] font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero food image collage */}
          <div className="relative h-[420px] sm:h-[500px] lg:h-[560px]">
            {/* Main burger image */}
            <div className="absolute top-4 right-0 w-[75%] h-[75%] rounded-[2rem] overflow-hidden shadow-card border-4 border-white/80 animate-float z-20">
              <img src={HERO_BURGER} alt="Delicious burger" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                <p className="font-hand text-white text-2xl">Juicy Burgers!</p>
              </div>
            </div>

            {/* Secondary: pizza */}
            <div className="absolute bottom-0 left-0 w-[50%] h-[45%] rounded-2xl overflow-hidden shadow-card border-4 border-white/80 animate-float-reverse z-30">
              <img src={PIZZA_IMG} alt="Fresh pizza" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="font-hand text-white text-xl">Fresh Pizza 🍕</p>
              </div>
            </div>

            {/* Floating tag */}
            <div className="absolute top-0 left-8 z-40 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2 animate-wiggle">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs font-bold text-[#2D1810]">Trending Now</p>
                <p className="text-[10px] text-[#8B6B50]">Chicken Tenders</p>
              </div>
            </div>

            {/* Floating rating badge */}
            <div className="absolute bottom-16 right-4 z-40 bg-[#D94F30] text-white rounded-2xl shadow-warm px-4 py-3 animate-pulse-glow">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#F2A93B] text-[#F2A93B]" />
                ))}
              </div>
              <p className="text-xs font-bold mt-1">AI Powered</p>
            </div>

            {/* Decorative circles */}
            <div className="absolute -bottom-4 right-1/3 w-20 h-20 rounded-full bg-[#F2A93B]/20 blur-sm" />
            <div className="absolute top-1/4 -left-4 w-12 h-12 rounded-full bg-[#D94F30]/15 blur-sm" />
          </div>
        </div>
      </section>

      {/* ═══ WAVY DIVIDER ═══ */}
      <div className="wavy-divider opacity-60" />

      {/* ═══ CATEGORIES SECTION ═══ */}
      <section id="categories" className="relative z-10 py-16 md:py-24 bg-gradient-to-b from-transparent to-[#F5DFC5]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="font-hand text-2xl text-[#D94F30] mb-2">Explore our menu</p>
            <h2 className="font-display text-4xl sm:text-5xl text-[#2D1810] tracking-wide">
              CHOOSE YOUR <span className="text-[#D94F30]">ADVENTURE</span>
            </h2>
            <p className="mt-4 text-[#8B6B50] max-w-lg mx-auto">
              From sizzling burgers to heavenly desserts — just pick a category or ask Sage anything!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.name}
                to="/chat"
                search={{ q: cat.name }}
                className="group relative rounded-[1.5rem] overflow-hidden h-52 sm:h-64 shadow-card hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl mb-1">{cat.emoji}</p>
                      <h3 className="font-display text-xl text-white tracking-wide">{cat.name}</h3>
                      <p className="text-xs text-white/70 font-medium">{cat.count} recipes</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-[#D94F30] transition-colors">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WAVY DIVIDER ═══ */}
      <div className="wavy-divider opacity-60" />

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="relative z-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="font-hand text-2xl text-[#F2A93B] mb-2">How it works</p>
            <h2 className="font-display text-4xl sm:text-5xl text-[#2D1810] tracking-wide">
              ANOTHER DAY, <span className="text-[#D94F30]">ANOTHER DISH!</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-white/80 backdrop-blur border-2 border-[#E8CCAB] rounded-[1.5rem] p-8 hover:border-[#D94F30]/40 hover:shadow-card transition-all duration-300"
              >
                {/* Step number */}
                <div className="absolute -top-4 -right-2 font-display text-6xl text-[#D94F30]/10 leading-none">
                  #{i + 1}
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-warm mb-5">
                  <f.icon className="w-6 h-6 text-white" strokeWidth={2.2} />
                </div>

                <h3 className="font-display text-xl text-[#2D1810] tracking-wide mb-3">{f.title}</h3>
                <p className="text-[#8B6B50] leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="relative z-10 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-hero p-10 md:p-16 shadow-warm">
            {/* Decorative elements */}
            <div className="absolute top-4 right-8 text-5xl opacity-30 animate-float">🍕</div>
            <div className="absolute bottom-4 left-8 text-5xl opacity-30 animate-float-reverse">🍔</div>
            <div className="absolute top-1/2 right-1/4 text-4xl opacity-20 animate-wiggle">🌮</div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wide leading-tight">
                READY TO <span className="text-[#FDF0E0]">COOK?</span>
              </h2>
              <p className="mt-4 text-white/80 text-lg">
                Jump into a conversation with Sage and discover your next favorite meal. 
                It's like having a personal chef who knows 125,000 recipes by heart!
              </p>
              <Link
                to="/chat"
                className="group inline-flex items-center gap-3 bg-white text-[#D94F30] px-10 py-4 rounded-full text-lg font-bold mt-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Start Chatting</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t-2 border-[#E8CCAB] bg-[#F5DFC5]/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-warm">
                <span className="text-xl">🍳</span>
              </div>
              <div>
                <p className="font-display text-xl text-[#2D1810] tracking-wide">Sage</p>
                <p className="text-xs text-[#8B6B50]">AI Recipe Companion</p>
              </div>
            </div>

            <p className="text-sm text-[#8B6B50]">
              Built with ❤️ using React, Llama 3.3 AI & Supabase · 125,000+ recipes
            </p>

            <Link
              to="/chat"
              className="flex items-center gap-2 bg-[#D94F30] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-warm hover:bg-[#C0392B] transition hover:scale-105"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open Chat</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
