import supabaseLoader from "@/lib/supabase/supabase-image-loader";
import type { Avatar } from "@/types/user";
import Image from "next/image";
import React from "react";

interface OldAvatarsProps {
  avatars: Avatar[];
}

function OldAvatars({ avatars }: OldAvatarsProps) {
  return (
    <div className="flex sm:flex-row flex-col gap-2">
      {avatars.map((items) => (
        <Image
          loader={supabaseLoader}
          key={items.name}
          src={items.fullPath}
          width={200}
          height={200}
          alt={`Avatar user ${items.name}`}
        />
      ))}
    </div>
  );
}

export default OldAvatars;
