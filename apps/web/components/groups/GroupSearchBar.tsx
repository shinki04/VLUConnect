import React, { useEffect, useState } from "react";

interface GroupSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function GroupSearchBar({ onSearch, placeholder = "Tìm kiếm nhóm theo tên, khoa, hoặc sở thích...", debounceMs = 300 }: GroupSearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="group-search flex-1 relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-gray-400">search</span>
      </div>
      <input
        className="block w-full pl-10 pr-3 py-2.5 rounded-lg leading-5 sm:text-sm transition-colors group-search-input"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
