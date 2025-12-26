import { createClient } from "@repo/supabase/server";

export default async function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Optional: Redirect if not logged in? Or allow public view. 
    // Keeping it accessible.

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
