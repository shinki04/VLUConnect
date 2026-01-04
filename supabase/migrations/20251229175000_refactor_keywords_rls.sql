-- Create Helper RPCs for RLS
CREATE OR REPLACE FUNCTION public.check_global_min_role(min_role public.global_roles) 
RETURNS BOOLEAN AS d:\Coder\React\the-last
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      global_role = 'admin'
      OR (min_role = 'moderator' AND global_role = 'moderator')
      OR (min_role = 'lecturer' AND global_role IN ('moderator', 'lecturer'))
      OR (min_role = 'student') -- everyone has at least student basically, but usually for strict checks
    )
  );
END;
d:\Coder\React\the-last LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_group_min_role(group_id UUID, min_role public.group_roles)
RETURNS BOOLEAN AS d:\Coder\React\the-last
BEGIN
  -- Global admins/mods always have access
  IF check_global_min_role('moderator') THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = check_group_min_role.group_id
    AND group_members.user_id = auth.uid()
    AND (
      role = 'admin'
      OR (min_role = 'sub_admin' AND role = 'sub_admin')
      OR (min_role = 'moderator' AND role IN ('sub_admin', 'moderator'))
      OR (min_role = 'member')
    )
  );
END;
d:\Coder\React\the-last LANGUAGE plpgsql SECURITY DEFINER;


-- Refactor blocked_keywords policies to use RPCs
DROP POLICY IF EXISTS "Global staff can view global keywords" ON public.blocked_keywords;
DROP POLICY IF EXISTS "Group staff can view group keywords" ON public.blocked_keywords;
DROP POLICY IF EXISTS "Global admin can manage global keywords" ON public.blocked_keywords;
DROP POLICY IF EXISTS "Group staff can manage group keywords" ON public.blocked_keywords;

-- READ: Global keywords (Global Admin/Mod)
CREATE POLICY "Global staff can view global keywords"
ON public.blocked_keywords FOR SELECT
TO authenticated
USING (
  scope = 'global' AND check_global_min_role('moderator')
);

-- READ: Group keywords (Group Admin/Mod + Global Admin/Mod)
CREATE POLICY "Group staff can view group keywords"
ON public.blocked_keywords FOR SELECT
TO authenticated
USING (
  scope = 'group' AND check_group_min_role(group_id, 'moderator')
);

-- WRITE: Global keywords (Global Admin only)
CREATE POLICY "Global admin can manage global keywords"
ON public.blocked_keywords FOR ALL
TO authenticated
USING (
  scope = 'global' AND check_global_min_role('admin')
)
WITH CHECK (
  scope = 'global' AND check_global_min_role('admin')
);

-- WRITE: Group keywords (Group Admin/Mod)
CREATE POLICY "Group staff can manage group keywords"
ON public.blocked_keywords FOR ALL
TO authenticated
USING (
  scope = 'group' AND check_group_min_role(group_id, 'moderator')
)
WITH CHECK (
  scope = 'group' AND check_group_min_role(group_id, 'moderator')
);