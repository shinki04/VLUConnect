// Query keys for conversations - shared between server and client
export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  friendship: (id: string) =>
    [...conversationKeys.all, "friendship", id] as const,
};

// Query keys for messages - shared between server and client
export const messageKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) => [...messageKeys.all, "list", conversationId] as const,
};
