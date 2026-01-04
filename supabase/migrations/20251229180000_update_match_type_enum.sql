-- Create enum type
CREATE TYPE public.keyword_match_type AS ENUM ('exact', 'partial');

-- Alter table to use enum
ALTER TABLE public.blocked_keywords DROP CONSTRAINT IF EXISTS blocked_keywords_match_type_check;

ALTER TABLE public.blocked_keywords 
  ALTER COLUMN match_type DROP DEFAULT,
  ALTER COLUMN match_type TYPE public.keyword_match_type USING match_type::public.keyword_match_type,
  ALTER COLUMN match_type SET DEFAULT 'partial'::public.keyword_match_type;