"use client";

import { ReportType } from "@repo/shared/types/report";
import { useEffect, useState } from "react";

import { getModerationAction, ModerationAction } from "@/app/actions/moderation";

/**
 * Hook to fetch moderation reason for deleted content
 * Only fetches if isDeleted is true
 */
export function useModerationReason(
    targetType: ReportType,
    targetId: string | undefined,
    isDeleted: boolean | undefined
) {
    const [moderationAction, setModerationAction] = useState<ModerationAction | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isDeleted || !targetId) {
            setModerationAction(null);
            return;
        }

        let mounted = true;

        async function fetchReason() {
            setIsLoading(true);
            try {
                if (!targetId) return; // Guard check
                const action = await getModerationAction(targetType, targetId);
                if (mounted) {
                    setModerationAction(action);
                }
            } catch (error) {
                console.error("Error fetching moderation reason:", error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchReason();

        return () => {
            mounted = false;
        };
    }, [targetType, targetId, isDeleted]);

    return { moderationAction, isLoading };
}
