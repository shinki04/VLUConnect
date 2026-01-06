// Query keys for conversations - shared between server and client
export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  friendship: (id: string) =>
    [...conversationKeys.all, "friendship", id] as const,
};
