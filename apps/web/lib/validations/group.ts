import { Privacy_Group, Membership_Mode } from "@repo/shared/types/group";
import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string(), // Empty string allowed, server handles null
  privacy_level: z.enum(["public", "private"] as Privacy_Group[]),
  membership_mode: z.enum(["auto", "request"] as Membership_Mode[]),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
