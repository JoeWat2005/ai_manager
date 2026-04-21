"use client";

import { PlusIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { inviteMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InviteMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await inviteMember(formData);
      toast.success("Invitation sent");
      formRef.current?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="email" className="text-xs">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="colleague@company.com"
          required
          className="h-9 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role" className="text-xs">Role</Label>
        <Select name="role" defaultValue="org:member">
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="org:member">Member</SelectItem>
            <SelectItem value="org:admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" className="gap-1.5 self-end">
        <PlusIcon className="size-3.5" />
        Invite
      </Button>
    </form>
  );
}
