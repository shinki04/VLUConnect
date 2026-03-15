"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Check, ChevronsUpDown, Hash, X } from "lucide-react";
import * as React from "react";

import { getHashtagsForSelect } from "@/app/actions/admin-hashtags";

interface Hashtag {
  id: string;
  name: string;
  post_count: number | null;
}

interface HashtagSelectorProps {
  selectedHashtags: Hashtag[];
  onSelectionChange: (hashtags: Hashtag[]) => void;
  maxSelection?: number;
}

export function HashtagSelector({
  selectedHashtags,
  onSelectionChange,
  maxSelection = 5,
}: HashtagSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [hashtags, setHashtags] = React.useState<Hashtag[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchHashtags = React.useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      const result = await getHashtagsForSelect(searchTerm, 30);
      setHashtags(result);
    } catch (error) {
      console.error("Failed to fetch hashtags:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHashtags();
  }, [fetchHashtags]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        fetchHashtags(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchHashtags]);

  const handleSelect = (hashtag: Hashtag) => {
    const isSelected = selectedHashtags.some((h) => h.id === hashtag.id);
    if (isSelected) {
      onSelectionChange(selectedHashtags.filter((h) => h.id !== hashtag.id));
    } else if (selectedHashtags.length < maxSelection) {
      onSelectionChange([...selectedHashtags, hashtag]);
    }
  };

  const handleRemove = (hashtagId: string) => {
    onSelectionChange(selectedHashtags.filter((h) => h.id !== hashtagId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedHashtags.length === 0
                ? "Chọn hashtag..."
                : `${selectedHashtags.length} đã chọn`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Tìm kiếm hashtag..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Đang tải..." : "Không tìm thấy hashtag."}
              </CommandEmpty>
              <CommandGroup>
                {hashtags.map((hashtag) => {
                  const isSelected = selectedHashtags.some(
                    (h) => h.id === hashtag.id,
                  );
                  const isDisabled =
                    !isSelected && selectedHashtags.length >= maxSelection;
                  return (
                    <CommandItem
                      key={hashtag.id}
                      value={hashtag.name}
                      onSelect={() => handleSelect(hashtag)}
                      disabled={isDisabled}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span>{hashtag.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({hashtag.post_count ?? 0} bài viết)
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedHashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedHashtags.map((hashtag) => (
            <Badge key={hashtag.id} variant="secondary" className="gap-1">
              #{hashtag.name}
              <button
                type="button"
                onClick={() => handleRemove(hashtag.id)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selectedHashtags.length >= maxSelection && (
        <p className="text-xs text-muted-foreground">
          Tối đa {maxSelection} hashtag có thể so sánh
        </p>
      )}
    </div>
  );
}
