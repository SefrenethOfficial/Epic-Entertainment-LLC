import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

const BAD_WORDS = ["fuck", "shit", "ass", "bitch", "cunt", "dick", "cock", "pussy", "nigger", "faggot", "retard", "whore", "slut"];

function containsBadWord(str) {
  const lower = str.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}

export default function AccountSetupDialog({ open, onSave, existingName, existingAvatar, existingAvatarUrl, isEditor }) {
  const [name, setName] = useState(existingName || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(existingName || "");
    setError("");
  }, [open, existingName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Please enter a display name."); return; }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (trimmed.length > 20) { setError("Name must be 20 characters or less."); return; }
    if (containsBadWord(trimmed)) { setError("That name contains inappropriate language. Please choose another."); return; }
    setError("");
    setSaving(true);
    await onSave({ display_name: trimmed, avatar: existingAvatar || "logo", avatar_url: existingAvatarUrl || "" });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {existingName ? "Edit Profile" : "Welcome! Set Up Your Profile"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <p className="text-sm text-muted-foreground">
            {existingName
              ? "Update your display name below."
              : "Choose a display name to get started. You can pick your avatar from the Avatar page!"}
          </p>

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <p className="text-xs text-muted-foreground">{name.length}/20</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {existingName ? "Save Changes" : "Get Started"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}