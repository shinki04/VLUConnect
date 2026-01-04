-- Create blocked_keywords table
CREATE TABLE IF NOT EXISTS public.blocked_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'partial' CHECK (match_type IN ('exact', 'partial')),
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'group')),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT blocked_keywords_group_id_check CHECK (
        (scope = 'global' AND group_id IS NULL) OR
        (scope = 'group' AND group_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_keywords_group_id ON public.blocked_keywords(group_id);
CREATE INDEX IF NOT EXISTS idx_blocked_keywords_keyword ON public.blocked_keywords(keyword);

-- Enable RLS
ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;

-- Policies
-- READ: Global keywords (Global Admin/Mod)
CREATE POLICY "Global staff can view global keywords"
ON public.blocked_keywords FOR SELECT
TO authenticated
USING (
  scope = 'global' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role IN ('admin', 'moderator'))
);

-- READ: Group keywords (Group Admin/Mod + Global Admin/Mod)
CREATE POLICY "Group staff can view group keywords"
ON public.blocked_keywords FOR SELECT
TO authenticated
USING (
  scope = 'group' AND (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = blocked_keywords.group_id AND user_id = auth.uid() AND role IN ('admin', 'sub_admin', 'moderator')) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role IN ('admin', 'moderator'))
  )
);

-- WRITE: Global keywords (Global Admin only)
CREATE POLICY "Global admin can manage global keywords"
ON public.blocked_keywords FOR ALL
TO authenticated
USING (
  scope = 'global' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'admin')
)
WITH CHECK (
  scope = 'global' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND global_role = 'admin')
);

-- WRITE: Group keywords (Group Admin/Mod)
CREATE POLICY "Group staff can manage group keywords"
ON public.blocked_keywords FOR ALL
TO authenticated
USING (
  scope = 'group' AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = blocked_keywords.group_id AND user_id = auth.uid() AND role IN ('admin', 'sub_admin', 'moderator'))
)
WITH CHECK (
  scope = 'group' AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = blocked_keywords.group_id AND user_id = auth.uid() AND role IN ('admin', 'sub_admin', 'moderator'))
);