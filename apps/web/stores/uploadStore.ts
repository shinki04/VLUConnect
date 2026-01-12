"use client";

import { createClient } from "@repo/supabase/client";
import { create } from "zustand";

import { sendMessage as sendMessageAction } from "@/app/actions/messaging";

/**
 * Pending upload item - simplified tracking
 */
interface PendingUpload {
    id: string;
    conversationId: string;
    tempMessageId: string;
}

/**
 * Global upload store state
 */
interface UploadState {
    // Map of conversationId -> pending uploads
    pendingUploads: Map<string, PendingUpload[]>;
    // Map of tempMessageId -> upload progress
    uploadProgress: Map<string, number>;
    // Map of tempMessageId -> uploaded URL
    completedUrls: Map<string, string[]>;
    // Map of tempMessageId -> error
    uploadErrors: Map<string, string>;

    // Actions
    addUpload: (upload: PendingUpload) => void;
    updateProgress: (tempMessageId: string, progress: number) => void;
    completeUpload: (tempMessageId: string, urls: string[]) => void;
    failUpload: (tempMessageId: string, error: string) => void;
    removeUpload: (tempMessageId: string) => void;
    getUploadsForConversation: (conversationId: string) => PendingUpload[];
    getProgress: (tempMessageId: string) => number;
    getCompletedUrls: (tempMessageId: string) => string[] | undefined;
    getError: (tempMessageId: string) => string | undefined;
}

export const useUploadStore = create<UploadState>()((set, get) => ({
    pendingUploads: new Map(),
    uploadProgress: new Map(),
    completedUrls: new Map(),
    uploadErrors: new Map(),

    addUpload: (upload) => {
        set((state) => {
            const newMap = new Map(state.pendingUploads);
            const existing = newMap.get(upload.conversationId) || [];
            newMap.set(upload.conversationId, [...existing, upload]);
            return { pendingUploads: newMap };
        });
    },

    updateProgress: (tempMessageId, progress) => {
        set((state) => {
            const newMap = new Map(state.uploadProgress);
            newMap.set(tempMessageId, progress);
            return { uploadProgress: newMap };
        });
    },

    completeUpload: (tempMessageId, urls) => {
        set((state) => {
            const newUrls = new Map(state.completedUrls);
            newUrls.set(tempMessageId, urls);

            // Remove from pending
            const newPending = new Map(state.pendingUploads);
            for (const [convId, uploads] of newPending) {
                newPending.set(
                    convId,
                    uploads.filter((u) => u.tempMessageId !== tempMessageId)
                );
            }

            return { completedUrls: newUrls, pendingUploads: newPending };
        });
    },

    failUpload: (tempMessageId, error) => {
        set((state) => {
            const newErrors = new Map(state.uploadErrors);
            newErrors.set(tempMessageId, error);
            return { uploadErrors: newErrors };
        });
    },

    removeUpload: (tempMessageId) => {
        set((state) => {
            const newPending = new Map(state.pendingUploads);
            for (const [convId, uploads] of newPending) {
                newPending.set(
                    convId,
                    uploads.filter((u) => u.tempMessageId !== tempMessageId)
                );
            }

            const newProgress = new Map(state.uploadProgress);
            newProgress.delete(tempMessageId);

            const newUrls = new Map(state.completedUrls);
            newUrls.delete(tempMessageId);

            const newErrors = new Map(state.uploadErrors);
            newErrors.delete(tempMessageId);

            return {
                pendingUploads: newPending,
                uploadProgress: newProgress,
                completedUrls: newUrls,
                uploadErrors: newErrors,
            };
        });
    },

    getUploadsForConversation: (conversationId) => {
        return get().pendingUploads.get(conversationId) || [];
    },

    getProgress: (tempMessageId) => {
        return get().uploadProgress.get(tempMessageId) ?? 0;
    },

    getCompletedUrls: (tempMessageId) => {
        return get().completedUrls.get(tempMessageId);
    },

    getError: (tempMessageId) => {
        return get().uploadErrors.get(tempMessageId);
    },
}));

/**
 * Global upload manager - handles file uploads in background
 * This runs outside of React lifecycle
 */
class UploadManager {
    private supabase = createClient();
    private activeUploads = new Set<string>();

    /**
     * Start uploading files for a message
     */
    async uploadFiles(
        conversationId: string,
        tempMessageId: string,
        files: File[],
        content: string,
        replyToId?: string,
        onComplete?: (urls: string[]) => void,
        onError?: (error: string) => void
    ): Promise<void> {
        // Prevent duplicate uploads
        if (this.activeUploads.has(tempMessageId)) {
            return;
        }
        this.activeUploads.add(tempMessageId);

        const store = useUploadStore.getState();
        const totalFiles = files.length;
        let completedFiles = 0;
        const urls: string[] = [];

        try {
            for (const file of files) {
                // Create unique path: conversationId/uniqueId/originalFilename
                const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const objectName = `${conversationId}/${uniqueId}/${file.name}`;

                const { error } = await this.supabase.storage
                    .from("messages")
                    .upload(objectName, file, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (error) {
                    throw new Error(`Upload failed: ${file.name} - ${error.message}`);
                }

                const { data: urlData } = this.supabase.storage
                    .from("messages")
                    .getPublicUrl(objectName);

                urls.push(urlData.publicUrl);
                completedFiles++;

                // Update progress
                const progress = Math.round((completedFiles / totalFiles) * 100);
                store.updateProgress(tempMessageId, progress);
            }

            // All files uploaded - save message to database
            await sendMessageAction(
                conversationId,
                content,
                files.length > 0 ? "file" : "text",
                tempMessageId,
                replyToId,
                urls
            );

            // Mark complete
            store.completeUpload(tempMessageId, urls);
            onComplete?.(urls);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            store.failUpload(tempMessageId, errorMessage);
            onError?.(errorMessage);
        } finally {
            this.activeUploads.delete(tempMessageId);
        }
    }

    /**
     * Upload files for a post (continues in background)
     */
    async uploadPostFiles(
        userId: string,
        files: File[],
        uploadId: string,
        onProgress?: (progress: number) => void,
        onComplete?: (urls: string[]) => void,
        onError?: (error: string) => void
    ): Promise<string[]> {
        // Prevent duplicate uploads
        if (this.activeUploads.has(uploadId)) {
            return [];
        }
        this.activeUploads.add(uploadId);

        const store = useUploadStore.getState();
        const totalFiles = files.length;
        let completedFiles = 0;
        const urls: string[] = [];

        try {
            for (const file of files) {
                // Create unique path: userId/uniqueId/originalFilename
                const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const objectName = `${userId}/${uniqueId}/${file.name}`;

                const { error } = await this.supabase.storage
                    .from("posts")
                    .upload(objectName, file, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (error) {
                    throw new Error(`Upload failed: ${file.name} - ${error.message}`);
                }

                const { data: urlData } = this.supabase.storage
                    .from("posts")
                    .getPublicUrl(objectName);

                urls.push(urlData.publicUrl);
                completedFiles++;

                // Update progress
                const progress = Math.round((completedFiles / totalFiles) * 100);
                store.updateProgress(uploadId, progress);
                onProgress?.(progress);
            }

            // Mark complete
            store.completeUpload(uploadId, urls);
            onComplete?.(urls);
            return urls;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            store.failUpload(uploadId, errorMessage);
            onError?.(errorMessage);
            throw error;
        } finally {
            this.activeUploads.delete(uploadId);
        }
    }

    /**
     * Cancel an active upload
     */
    cancelUpload(tempMessageId: string): void {
        this.activeUploads.delete(tempMessageId);
        useUploadStore.getState().removeUpload(tempMessageId);
    }

    /**
     * Check if an upload is active
     */
    isUploading(uploadId: string): boolean {
        return this.activeUploads.has(uploadId);
    }
}

// Singleton instance
export const uploadManager = new UploadManager();
