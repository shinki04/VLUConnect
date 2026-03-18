import { Tables } from "./database.types";

export type Friendship = Tables<"friendships">;
export type FriendshipStatus = Friendship["status"];

export interface FriendshipWithUser extends Friendship {
  requester?: Tables<"profiles">;
  addressee?: Tables<"profiles">;
}

export interface FriendshipResult {
  status: FriendshipStatus | null;
  direction: "sent" | "received" | null;
  friendship: Friendship | null;
}
