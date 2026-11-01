const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";

function AvatarDisplay({ avatar, avatarUrl }) {
  if ((avatar === "custom" || (avatar && avatar.startsWith("custom_db_"))) && avatarUrl)
    return <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />;
  return <img src={LOGO_URL} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />;
}

export default function DetectiveDialog({ open, onOpenChange }) {
  const [profiles, setProfiles] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    async function load() {
      const user = await db.auth.me();
      const mine = await db.entities.UserProfile.filter({ user_id: user.id });
      if (mine.length > 0) setMyProfile(mine[0]);
      const all = await db.entities.UserProfile.list("-epicbucks", 100);
      setProfiles(all.filter(p => p.display_name && !p.banned));
    }
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const lastSuspect = myProfile?.last_suspect_time ? new Date(myProfile.last_suspect_time).getTime() : 0;
  const cooldownEnd = lastSuspect + 3600000;
  const inCooldown = now < cooldownEnd;
  const cooldownRemaining = Math.ceil((cooldownEnd - now) / 60000);

  const handleSuspect = async (target) => {
    if (inCooldown || !myProfile || busy) return;
    setBusy(true);
    const targetLastPrint = target.last_print_time ? new Date(target.last_print_time).getTime() : 0;
    const printedRecently = Date.now() - targetLastPrint < 3600000;

    if (printedRecently) {
      await db.entities.UserProfile.update(target.id, {
        epicbucks: Math.max(0, (target.epicbucks || 0) - 50),
        layer_banned_until: new Date(Date.now() + 4 * 3600000).toISOString(),
      });
    }
    const updated = await db.entities.UserProfile.update(myProfile.id, {
      last_suspect_time: new Date().toISOString(),
    });
    setMyProfile(updated);
    setResult({ caught: printedRecently, targetName: target.display_name });
    setBusy(false);
    const all = await db.entities.UserProfile.list("-epicbucks", 100);
    setProfiles(all.filter(p => p.display_name && !p.banned));
  };

  const others = profiles.filter(p => p.user_id !== myProfile?.user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            🕵️ Detective Mode
          </DialogTitle>
        </DialogHeader>

        {inCooldown ? (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-center">
            <p className="text-sm text-destructive font-semibold">⏳ On cooldown</p>
            <p className="text-xs text-muted-foreground">Can suspect again in {cooldownRemaining} min</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center px-2">
            Suspect a user who printed in the last hour. Correct: they lose 50 💵 + 4h Layer ban.
            Wrong: you wait 1h to guess again.
          </p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={result.targetName + Date.now()}
              className={`rounded-xl p-3 text-center border ${result.caught ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
              {result.caught ? (
                <p className="text-sm text-green-400 font-semibold">🎯 Caught {result.targetName}! They lose 50 💵 and are banned from the Layer for 4h.</p>
              ) : (
                <p className="text-sm text-destructive font-semibold">❌ {result.targetName} hasn't printed recently. 1h cooldown activated.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {others.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No other players yet.</p>}
          {others.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border">
              <AvatarDisplay avatar={p.avatar} avatarUrl={p.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{p.display_name}</p>
                <p className="text-xs text-muted-foreground">💵 {(p.epicbucks || 0).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="outline" disabled={inCooldown || busy}
                onClick={() => handleSuspect(p)} className="h-8 text-xs gap-1">
                🕵️ Suspect
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}