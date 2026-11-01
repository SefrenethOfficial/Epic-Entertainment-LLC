import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RODS } from "./rods";

export default function RodShop({ ownedRodIds = ["basic"], equippedRodId = "basic", userPoints = 0, userDiamonds = 0, onBuy, onEquip }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-foreground">🛒 Rod Shop</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-yellow-400 font-bold">⭐ {userPoints.toLocaleString()}</span>
          <span className="text-cyan-400 font-bold">💎 {userDiamonds}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RODS.map(rod => {
          const owned = ownedRodIds.includes(rod.id);
          const equipped = equippedRodId === rod.id;
          const canAfford = rod.currency === "points" ? userPoints >= rod.price : userDiamonds >= rod.price;
          return (
            <motion.div key={rod.id}
              className={`rounded-xl border-2 p-4 flex items-center gap-3 transition-colors ${
                equipped ? "border-primary bg-primary/10" : owned ? "border-accent/40 bg-accent/5" : "border-border bg-secondary/30"
              }`}>
              <div className="text-3xl flex-shrink-0">{rod.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-bold text-sm text-foreground">{rod.name}</p>
                  {equipped && <span className="text-[10px] text-primary font-bold uppercase">Equipped</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{rod.desc}</p>
                {/* Stats bars */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-muted-foreground w-8">Zone</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${(rod.zoneSize / 40) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-8">Luck</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${rod.rarityBoost * 1.8}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {equipped ? (
                  <span className="text-xs text-primary font-bold">✓ Active</span>
                ) : owned ? (
                  <Button size="sm" variant="outline" onClick={() => onEquip(rod)} className="h-8 text-xs">Equip</Button>
                ) : (
                  <Button size="sm" disabled={!canAfford} onClick={() => onBuy(rod)} className="h-8 text-xs gap-1">
                    {rod.currency === "points" ? `⭐ ${rod.price}` : `💎 ${rod.price}`}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}