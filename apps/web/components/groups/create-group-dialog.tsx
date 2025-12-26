/* eslint-disable react/no-children-prop */ 
"use client";
import { useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Label } from "@repo/ui/components/label";
import { createGroup } from "@/app/actions/group";
import { createGroupSchema } from "@/lib/validations/group";
import { toast } from "sonner";
import { Users, Lock, Globe } from "lucide-react";
import { Membership_Mode, Privacy_Group } from "@repo/shared/types/group";

export function CreateGroupDialog() {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      privacy_level: "public" as "public" | "private",
      membership_mode: "auto" as "auto" | "request",
    },
    validators: {
        onChange: createGroupSchema,
    },
    onSubmit: async ({ value }) => {
       startTransition(async () => {
        const formData = new FormData();
        Object.entries(value).forEach(([key, val]) => {
            formData.append(key, val ?? "");
        });

        try {
            const result = await createGroup(formData);
            if (result?.error) {
               if (typeof result.error === 'string') {
                   toast.error(result.error);
               } else {
                   toast.error("Please check the form for errors");
               }
            } else {
                toast.success("Group created successfully!");
            }
        } catch (error) {
            // Re-throw NEXT_REDIRECT error so redirect works properly
            if (isRedirectError(error)) {
                throw error;
            }
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Something went wrong: ${message}`);
        }
       });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
            <Users className="mr-2 h-4 w-4" />
            Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a new Group</DialogTitle>
          <DialogDescription>
            Start a community for people to connect and share.
          </DialogDescription>
        </DialogHeader>
        
        <form
            onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
            }}
            className="space-y-4"
        >
            <form.Field
                name="name"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                            id="name" 
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                                field.handleChange(e.target.value);
                                // Auto-slug with Vietnamese support
                                const slug = e.target.value
                                    .normalize("NFD") // Normalize to decomposed form
                                    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
                                    .replace(/đ/g, "d").replace(/Đ/g, "d") // Handle đ/Đ
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, "-")
                                    .replace(/^-+|-+$/g, "");
                                form.setFieldValue("slug", slug);
                            }}
                            placeholder="e.g. React Developers" 
                        />
                         {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.map((e) => typeof e === 'string' ? e : e?.message || String(e)).join(", ")}
                            </p>
                        )}
                    </div>
                )}
            />

            <form.Field
                name="slug"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug</Label>
                        <div className="flex items-center">
                            <span className="text-muted-foreground mr-1 text-sm">/groups/</span>
                            <Input 
                                id="slug" 
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="react-developers" 
                            />
                        </div>
                        {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                             <p className="text-sm text-red-500">
                               {field.state.meta.errors.map((e) => typeof e === 'string' ? e : e?.message || String(e)).join(", ")}
                             </p>
                        )}
                    </div>
                )}
            />

            <form.Field
                name="description"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description" 
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="What is this group about?" 
                        />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                 <form.Field
                    name="privacy_level"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label>Privacy</Label>
                            <Select 
                                value={field.state.value} 
                                onValueChange={(val: Privacy_Group) => field.handleChange(val as Privacy_Group)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select privacy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            <span>Public</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="private">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4" />
                                            <span>Private</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
                 <form.Field
                    name="membership_mode"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label>Joining</Label>
                            <Select 
                                value={field.state.value} 
                                onValueChange={(val: Membership_Mode) => field.handleChange(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Automatic (Open)</SelectItem>
                                    <SelectItem value="request">Request (Approval)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
            </div>

            <DialogFooter>
               <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
                        {isSubmitting || isPending ? "Creating..." : "Create Group"}
                    </Button>
                )}
               />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
