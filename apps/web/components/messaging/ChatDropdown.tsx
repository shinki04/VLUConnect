import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { LogOut, MoreVertical, Settings, User } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ChatDropdownProps {
  type: "direct" | "group";
}

interface ChatDropdownDirectProps {
  userId?: string;
}

export function ChatDropdownDirect({ userId }: ChatDropdownDirectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="">
          <Link href={`/profile/${userId}`}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 mr-2" /> Trang cá nhân
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ChatDropdownGroupProps {
  onLeave?: () => void;
  onOpenSettings?: () => void;
}

export function ChatDropdownGroup({ onLeave, onOpenSettings }: ChatDropdownGroupProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onOpenSettings && (
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt nhóm
          </DropdownMenuItem>
        )}
        
        {onOpenSettings && onLeave && <DropdownMenuSeparator />}
        
        {onLeave && (
          <DropdownMenuItem
            onClick={onLeave}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Rời nhóm
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
