const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { motion } from "framer-motion";

const RARITY_WEIGHTS = { common: 50, uncommon: 25, rare: 15, epic: 8, legendary: 2 };

const RARITY_STYLES = {
  common: { border: "border-gray-500", text: "text-gray-400", glow: "shadow-gray-500/30" },
  uncommon: { border: "border-green-500", text: "text-green-400", glow: "shadow-green-500/30" },
  rare: { border: "border-blue-500", text: "text-blue-400", glow: "shadow-blue-500/30" },
  epic: { border: "border-purple-500", text: "text-purple-400", glow: "shadow-purple-500/30" },
  legendary: { border: "border-yellow-500", text: "text-yellow-400", glow: "shadow-yellow-500/50" },
};

function pickRandomItem(items) {
  const totalWeight = items.reduce((sum, item) => sum + (RARITY_WEIGHTS[item.rarity] || 10), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= (RARITY_WEIGHTS[item.rarity] || 10);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

const SPIN_COST = 50;

export default function MysteryBoxDialog({ open, onOpenChange, userProfile, setUserProfile }) {
  const [phase, setPhase] = useState("idle");
  const [wonItem, setWonItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setWonItem(null);
      setError("");
    }
  }, [open]);

  const handleOpen = async () => {
    if ((userProfile?.points || 0) < SPIN_COST) {
      setError(`Not enough points! You need ⭐${SPIN_COST} to spin.`);
      return;
    }
    setPhase("opening");
    setError("");
    try {
      const user = await db.auth.me();
      const items = await db.entities.Item.list();
      if (items.length === 0) {
        setError("No items available yet! Ask an editor to add some.");
        setPhase("idle");
        return;
      }
      const winner = pickRandomItem(items);
      const updated = await db.entities.UserProfile.update(userProfile.id, {
        points: (userProfile.points || 0) - SPIN_COST,
      });
      if (setUserProfile) setUserProfile(updated);
      await db.entities.InventoryItem.create({
        user_id: user.id,
        user_email: user.email,
        display_name: userProfile?.display_name || "",
        item_id: winner.id,
        item_name: winner.item_name,
        item_icon_url: winner.icon_url,
        item_rarity: winner.rarity,
        item_worth: winner.worth || 0,
      });
      setWonItem(winner);
      setTimeout(() => setPhase("revealed"), 1500);
    } catch (e) {
      setError("Something went wrong. Try again!");
      setPhase("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        {phase === "idle" && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="font-heading text-xl font-bold mb-2">Mystery Box</h2>
            <p className="text-muted-foreground text-sm mb-2">Open the box to receive a random item!</p>
            <p className="text-yellow-400 font-bold text-sm mb-4">Cost: ⭐ {SPIN_COST} per spin</p>
            <p className="text-muted-foreground text-xs mb-4">Your balance: ⭐ {(userProfile?.points || 0).toLocaleString()}</p>
            {error && <p className="text-destructive text-sm mb-4">{error}</p>}
            <Button onClick={handleOpen} disabled={(userProfile?.points || 0) < SPIN_COST} className="gap-2">
              🎁 Open Box (⭐{SPIN_COST})
            </Button>
          </div>
        )}

        {phase === "opening" && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              🎁
            </motion.div>
            <p className="text-muted-foreground">Opening...</p>
          </div>
        )}

        {phase === "revealed" && wonItem && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-center py-6"
          >
            <p className="text-sm text-muted-foreground mb-3">You got...</p>
            <div className={`inline-block p-4 rounded-xl border-2 ${RARITY_STYLES[wonItem.rarity]?.border || "border-border"} bg-secondary/50 mb-4 shadow-2xl ${RARITY_STYLES[wonItem.rarity]?.glow || ""}`}>
              {wonItem.icon_url ? (
                <img src={wonItem.icon_url} alt={wonItem.item_name} className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center text-4xl mb-2 mx-auto">📦</div>
              )}
              <p className="font-heading font-bold text-lg">{wonItem.item_name}</p>
              <p className={`text-xs font-bold uppercase mt-1 ${RARITY_STYLES[wonItem.rarity]?.text || "text-muted-foreground"}`}>{wonItem.rarity}</p>
              <p className="text-xs text-muted-foreground mt-1">Worth: {wonItem.worth || 0} pts</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setPhase("idle"); setWonItem(null); }}>
                Open Again
              </Button>
              <Button onClick={() => onOpenChange(false)}>Awesome!</Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}