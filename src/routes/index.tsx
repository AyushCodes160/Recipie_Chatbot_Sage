import { createFileRoute } from "@tanstack/react-router";
import { RecipeChat } from "@/components/RecipeChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sage — your AI recipe companion" },
      {
        name: "description",
        content:
          "Chat with Sage, an AI recipe assistant grounded in 5,000 real recipes. Ask for quick dinners, simple desserts, or 'something with chicken tenders'.",
      },
      { property: "og:title", content: "Sage — AI recipe companion" },
      {
        property: "og:description",
        content:
          "Find the perfect recipe by chatting. RAG-powered, conversational, and grounded in real cookbooks.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <RecipeChat />;
}
