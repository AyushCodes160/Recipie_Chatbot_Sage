
CREATE TABLE public.recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT NOT NULL,
  picture_link TEXT,
  num_steps INT NOT NULL DEFAULT 0,
  num_ingredients INT NOT NULL DEFAULT 0,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.recipes_search_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.num_ingredients := COALESCE(array_length(NEW.ingredients, 1), 0);
  NEW.num_steps := COALESCE(array_length(string_to_array(NEW.instructions, E'\n'), 1), 0);
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.ingredients, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.instructions, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER recipes_search_update
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.recipes_search_trigger();

CREATE INDEX recipes_search_idx ON public.recipes USING GIN (search_vector);
CREATE INDEX recipes_ingredients_idx ON public.recipes USING GIN (ingredients);
CREATE INDEX recipes_num_steps_idx ON public.recipes (num_steps);
CREATE INDEX recipes_num_ingredients_idx ON public.recipes (num_ingredients);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recipes"
  ON public.recipes FOR SELECT
  USING (true);

CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_conversations_session_idx ON public.chat_conversations (session_id, created_at);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage conversations"
  ON public.chat_conversations FOR ALL
  USING (true) WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  recipe_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_conv_idx ON public.chat_messages (conversation_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage chat messages"
  ON public.chat_messages FOR ALL
  USING (true) WITH CHECK (true);

-- Helper RPC to search recipes with optional max_steps filter
CREATE OR REPLACE FUNCTION public.search_recipes(
  query_text TEXT,
  max_steps INT DEFAULT NULL,
  max_ingredients INT DEFAULT NULL,
  match_limit INT DEFAULT 8
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  ingredients TEXT[],
  instructions TEXT,
  picture_link TEXT,
  num_steps INT,
  num_ingredients INT,
  rank REAL
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT r.id, r.title, r.ingredients, r.instructions, r.picture_link,
         r.num_steps, r.num_ingredients,
         ts_rank(r.search_vector, websearch_to_tsquery('english', query_text)) AS rank
  FROM public.recipes r
  WHERE r.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (max_steps IS NULL OR r.num_steps <= max_steps)
    AND (max_ingredients IS NULL OR r.num_ingredients <= max_ingredients)
  ORDER BY rank DESC, r.num_steps ASC
  LIMIT match_limit;
$$;
