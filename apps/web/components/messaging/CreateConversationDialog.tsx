"use client";

import { Tables } from "@repo/shared/types/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import { Check,Loader2, Search, UserPlus, Users, X } from "lucide-react";
import { useMemo,useState } from "react";

interface CreateConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Tables<"profiles">[];
  onCreateDirect: (userId: string) => Promise<void>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void>;
  isCreating?: boolean;
}

/**
 * Dialog for creating new direct or group conversations
 * Shows friends list for selection
 */
export function CreateConversationDialog({
  open,
  onOpenChange,
  friends,
  onCreateDirect,
  onCreateGroup,
  isCreating = false,
}: CreateConversationDialogProps) {
  const [mode, setMode] = useState<"select" | "direct" | "group">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  // Filter friends by search
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.display_name?.toLowerCase().includes(query) ||
        friend.username?.toLowerCase().includes(query) ||
        friend.email?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const reset = () => {
    setMode("select");
    setSearchQuery("");
    setSelectedUsers([]);
    setGroupName("");
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateDirect = async (userId: string) => {
    try {
      await onCreateDirect(userId);
      handleClose(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      await onCreateGroup(groupName.trim(), selectedUsers);
      handleClose(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "select" && "Tin nhắn mới"}
            {mode === "direct" && "Tin nhắn trực tiếp"}
            {mode === "group" && "Tạo nhóm"}
          </DialogTitle>
          <DialogDescription>
            {mode === "select" && "Chọn loại cuộc trò chuyện"}
            {mode === "direct" && "Chọn bạn bè để bắt đầu trò chuyện"}
            {mode === "group" && "Tạo nhóm chat với bạn bè"}
          </DialogDescription>
        </DialogHeader>

        {/* Mode selection */}
        {mode === "select" && (
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              onClick={() => setMode("direct")}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium">Tin nhắn trực tiếp</span>
              <span className="text-xs text-muted-foreground text-center">
                Nhắn tin 1-1 với bạn bè
              </span>
            </button>

            <button
              onClick={() => setMode("group")}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium">Tạo nhóm</span>
              <span className="text-xs text-muted-foreground text-center">
                Chat với nhiều người
              </span>
            </button>
          </div>
        )}

        {/* Direct message - friend selection */}
        {mode === "direct" && (
          <div className="py-2">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Friends list */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè"}
                </p>
              ) : (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleCreateDirect(friend.id)}
                    disabled={isCreating}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <Avatar className="h-10 w-10">
                      {friend.avatar_url && (
                        <AvatarImage
                          src={friend.avatar_url}
                          alt={friend.display_name || ""}
                        />
                      )}
                      <AvatarFallback>
                        {(friend.display_name || friend.username || "U")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">
                        {friend.display_name || friend.username}
                      </p>
                      {friend.username && friend.display_name && (
                        <p className="text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Group creation - multiple selection */}
        {mode === "group" && (
          <div className="py-2 space-y-4">
            {/* Group name */}
            <div className="space-y-2">
              <Label htmlFor="group-name">Tên nhóm</Label>
              <Input
                id="group-name"
                placeholder="Nhập tên nhóm..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            {/* Selected members */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = friends.find((f) => f.id === userId);
                  if (!user) return null;

                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {user.display_name || user.username}
                      <button
                        onClick={() => toggleUserSelection(userId)}
                        className="ml-1 hover:bg-accent rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bạn bè để thêm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Friends list with checkboxes */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè"}
                </p>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedUsers.includes(friend.id);

                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleUserSelection(friend.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        {friend.avatar_url && (
                          <AvatarImage
                            src={friend.avatar_url}
                            alt={friend.display_name || ""}
                          />
                        )}
                        <AvatarFallback>
                          {(friend.display_name || friend.username || "U")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">
                          {friend.display_name || friend.username}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {mode !== "select" && (
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setMode("select")}>
              Quay lại
            </Button>

            {mode === "group" && (
              <Button
                onClick={handleCreateGroup}
                disabled={
                  isCreating || !groupName.trim() || selectedUsers.length === 0
                }
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Tạo nhóm ({selectedUsers.length} người)
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
