import { createClient } from "@repo/supabase/server";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { Globe, Lock, Users } from "lucide-react";
import Image from "next/image";

async function getGroups() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("groups")
        .select(`
            *,
            members:group_members(count)
        `)
        .eq("privacy_level", "public") // Suggest public groups for now
        .limit(20);
    return data || [];
}

async function getMyGroups() {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return [];

     const { data } = await supabase
        .from("group_members")
        .select(`
            group:groups(*)
        `)
        .eq("user_id", user.id);
    
    return data?.map(m => m.group).filter(Boolean) || [];
}

export default async function GroupsPage() {
  const [suggestedGroups, myGroups] = await Promise.all([getGroups(), getMyGroups()]);

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Discover and join communities.
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {myGroups.length > 0 && (
          <section>
             <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map((group) => (
                    <Link href={`/groups/${group.slug}`} key={group.id} className="block group">
                         <Card className="h-full transition-all hover:border-primary/50">
                            <CardHeader>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="text-sm text-muted-foreground flex gap-4">
                                <span className="flex items-center gap-1">
                                    {group.privacy_level === 'public' ? <Globe className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                                    {group.privacy_level}
                                </span>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
             </div>
          </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Suggested for you</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestedGroups.map((group) => (
             <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="leading-tight mb-2">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                        {group.description || "No description provided."}
                        </CardDescription>
                    </div>
                     {/* Avatar placeholder */}
                     <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        {group.avatar_url ? (
                            <Image src={group.avatar_url} alt={group.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <Users className="w-5 h-5 opacity-50" />
                        )}
                     </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                 <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        {group.privacy_level === 'public' ? <Globe className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                        {group.privacy_level}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3"/>
                        {group.members[0]?.count || 0} members
                    </span>
                 </div>
              </CardContent>
              <CardFooter>
                 <Link href={`/groups/${group.slug}`} className="w-full">
                    <Button variant="outline" className="w-full">View Group</Button>
                 </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
