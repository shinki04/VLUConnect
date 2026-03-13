-- Tạo function xử lý tạo profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role public.global_roles;
  base_username text;
  new_username text;
  counter integer := 1;
BEGIN
  IF new.email LIKE '%@vlu.edu.vn' THEN
    assigned_role := 'lecturer'::public.global_roles;
  ELSIF new.email LIKE '%@vanlanguni.vn' THEN
    assigned_role := 'student'::public.global_roles;
  ELSE
    assigned_role := null;
  END IF;

  -- Use full_name directly as the preferred base username per user request
  base_username := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  new_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := base_username || counter::text;
    counter := counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, display_name, email, global_role, username)
  VALUES (
    new.id, 
    base_username, 
    new.email, 
    assigned_role,
    new_username
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Gắn trigger vào bảng auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
