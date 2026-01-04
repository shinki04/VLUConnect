-- Create ai_analysis_logs table
CREATE TABLE IF NOT EXISTS public.ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'review', 'message')),
    target_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    analysis_type TEXT NOT NULL, -- 'sentiment', 'toxicity', 'emotion', 'spam'
    label TEXT NOT NULL,
    score FLOAT NOT NULL, -- 0.0 to 1.0
    confidence FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_target ON public.ai_analysis_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON public.ai_analysis_logs(created_at);

-- Enable RLS
ALTER TABLE public.ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view analysis logs"
ON public.ai_analysis_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert analysis logs"
ON public.ai_analysis_logs FOR INSERT
TO authenticated
WITH CHECK (true);