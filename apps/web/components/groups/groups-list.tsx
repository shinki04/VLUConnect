"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Globe, Loader2,Lock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useMyGroups, useSuggestedGroups } from "@/hooks/useGroup";

export function GroupsList() {
  const { data: myGroups, isLoading: isLoadingMyGroups } = useMyGroups();
  const { data: suggestedGroups, isLoading: isLoadingSuggested } = useSuggestedGroups();

  if (isLoadingMyGroups && isLoadingSuggested) {
      return (
          <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  return (
    <div className="space-y-8">
      {/* My Groups Section */}
      {myGroups && myGroups.length > 0 && (
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

      {/* Suggested Groups Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Suggested for you</h2>
        {isLoadingSuggested ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedGroups?.map((group) => (
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
                         <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                            {group.avatar_url ? (
                                <Image src={group.avatar_url} alt={group.name} width={40} height={40} className="w-full h-full object-cover" />
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
                            {group.member_count !== undefined ? group.member_count : (group).members?.[0]?.count || 0} members
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
        )}
      </section>
    </div>
  );
}
