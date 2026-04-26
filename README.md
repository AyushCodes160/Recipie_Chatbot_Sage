# 🧑‍🍳 Sage: AI Recipe Assistant (RAG Application)

![Sage UI](https://img.shields.io/badge/AI_Powered-RAG-blue?style=for-the-badge) ![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue?style=for-the-badge) ![Vector Database](https://img.shields.io/badge/Supabase-pgvector-green?style=for-the-badge)

Sage is a conversational, Retrieval-Augmented Generation (RAG) chatbot designed to act as a personal sous-chef. It allows users to search, filter, and chat about over **125,000 unique recipes** using natural language.

This project was built to demonstrate proficiency in modern frontend frameworks, vector databases, and AI tooling.

---

## 🎯 Key Features & Assignment Fulfillment

- **Massive Knowledge Base:** Powered by the "Eight Portions" dataset, the application ingests, parses, and vectorizes over 125,000 recipes across Epicurious, Food Network, and AllRecipes.
- **Conversational Memory:** The chatbot retains conversational context, allowing users to ask follow-up questions like *"Can you make the second one dairy-free?"*
- **Advanced Parameter Extraction:** Implements an LLM-driven tool pipeline to extract specific user intent. For example, if a user asks:
  > *"Suggest a recipe that uses chicken tenders and takes less time/has fewer steps to cook"*
  The backend intelligently isolates the ingredient (`chicken tenders`), infers the constraint (`low steps`), and applies a strict SQL filter before hitting the vector search.
- **Real-time Streaming:** AI responses are streamed directly to the frontend for a fast, responsive user experience.

---

## 🛠️ Technology Stack

**Frontend:**
- **React 18** + **TypeScript**
- **Vite** (for blazing fast HMR and builds)
- **TailwindCSS** + **Shadcn UI** (for a beautiful, accessible, and responsive interface)
- **Lucide React** (iconography)

**Backend & AI:**
- **Google Gemini 2.5 Flash** (via Google AI Studio for fast, intelligent text generation and tool usage)
- **Supabase** (PostgreSQL)
- **pgvector** (for fast, scalable similarity searching across 125k recipes)

---

## 🧠 How the RAG Pipeline Works

1. **Vectorization:** Recipes are stored in Supabase with a `tsvector` generated from their title, ingredients, and instructions.
2. **Intent Planning:** When a user sends a message, Gemini first runs a `plan_recipe_search` tool to determine if a database search is necessary, extracting keywords and constraints (like maximum allowed steps or ingredients).
3. **Retrieval:** If needed, a custom Supabase RPC function (`search_recipes`) executes a high-speed GIN-indexed search against the database, filtering by constraints and returning the top matches.
4. **Generation:** The retrieved recipes are injected into the AI's system context, and a conversational response is streamed back to the user.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- A Supabase Project (with the provided SQL schema executed)
- A Google AI Studio API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushCodes160/Recipie_Chatbot_Sage.git
   cd Recipie_Chatbot_Sage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL="your_supabase_url"
   SUPABASE_PUBLISHABLE_KEY="your_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   
   VITE_SUPABASE_URL="your_supabase_url"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
   
   AI_API_KEY="your_google_ai_key"
   AI_GATEWAY_URL="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
   ```

4. **Seed the Database (Optional):**
   If starting from scratch, you can populate the Supabase database with the 125k recipes dataset:
   ```bash
   npx tsx --env-file=.env scripts/seed_recipes.ts
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will be available at http://localhost:5173*
