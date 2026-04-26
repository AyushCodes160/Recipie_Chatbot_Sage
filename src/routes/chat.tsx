import { createFileRoute } from "@tanstack/react-router";
import { RecipeChat } from "@/components/RecipeChat";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Sage — AI Recipe Assistant" },
      {
        name: "description",
        content:
          "Chat with Sage, an AI recipe assistant grounded in 125,000 real recipes. Ask for quick dinners, simple desserts, or something with chicken tenders.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return <RecipeChat />;
}
