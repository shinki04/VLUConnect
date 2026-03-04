"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-3 py-1.5 rounded-full text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200"
        >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Trở về</span>
        </button>
    );
}
