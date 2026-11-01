const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";

import { toast } from "sonner";

export default function InviteDialog({ open, onOpenChange }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await db.users.inviteUser(email.trim(), "user");
      setSent(true);
      toast.success(`Invitation sent to ${email}`);
      setTimeout(() => {
        setEmail("");
        setSent(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      toast.error("Failed to send invitation. Please try again.");
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite a Collaborator
          </DialogTitle>
          <DialogDescription>
            Invite someone to help manage and add games to the library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />
          </div>

          <Button type="submit" disabled={sending || sent} className="w-full gap-2">
            {sent ? (
              <>
                <CheckCircle className="w-4 h-4" /> Sent!
              </>
            ) : sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Send Invitation
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}