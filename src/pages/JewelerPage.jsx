const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, Gem, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DIAMOND_RATE = 5;

const RARITY_STYLES = {
  common: "border-gray-500",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
};

export default function JewelerPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meltAmount, setMeltAmount] = useState(1);
  const [selling, setSelling] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const user = await db.auth.me();
        const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setProfile(profiles[0]);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["inventory", profile?.user_id],
    queryFn: () => db.entities.InventoryItem.filter({ user_id: profile.user_id }, "-created_date"),
    enabled: !!profile,
  });

  const handleMelt = async () => {
    const amount = Math.min(meltAmount, profile?.diamonds || 0);
    if (amount <= 0) return;
    try {
      const updated = await db.entities.UserProfile.update(profile.id, {
        diamonds: (profile.diamonds || 0) - amount,
        epicbucks: (profile.epicbucks || 0) + amount * DIAMOND_RATE,
      });
      setProfile(updated);
      setMeltAmount(1);
      setToast({ text: `Melted ${amount} 💎 into ${amount * DIAMOND_RATE} 💵!`, color: "text-green-400" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { /* ignore */ }
  };

  const handleSell = async (item) => {
    setSelling(true);
    try {
      await db.entities.InventoryItem.delete(item.id);
      const updated = await db.entities.UserProfile.update(profile.id, {
        points: (profile.points || 0) + (item.item_worth || 0),
      });
      setProfile(updated);
      queryClient.invalidateQueries({ queryKey: ["inventory", profile.user_id] });
      setToast({ text: `Sold ${item.item_name} for ${item.item_worth || 0} pts!`, color: "text-green-400" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { /* ignore */ }
    setSelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold">The Jeweler</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-card border border-border shadow-2xl font-semibold text-sm ${toast.color}`}>
            {toast.text}
          </div>
        )}

        {/* Melt diamonds section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="font-heading text-lg font-bold">Melt Diamonds</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Melt your diamonds into EpicBucks. Rate: 1 💎 = {DIAMOND_RATE} 💵 EpicBucks
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
              <span className="text-cyan-400 font-bold">💎 {profile?.diamonds || 0}</span>
              <span className="text-muted-foreground text-xs">diamonds</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
              <span className="text-green-400 font-bold">💵 {profile?.epicbucks || 0}</span>
              <span className="text-muted-foreground text-xs">EpicBucks</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max={profile?.diamonds || 0}
              value={meltAmount}
              onChange={(e) => setMeltAmount(Math.max(1, Number(e.target.value)))}
              className="w-24"
            />
            <Button onClick={handleMelt} disabled={!profile || (profile.diamonds || 0) < 1} className="gap-2">
              <Flame className="w-4 h-4" /> Melt {meltAmount} Diamond{meltAmount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>

        {/* Sell items section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-bold mb-4">💰 Sell Items</h2>
          {itemsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-muted-foreground mb-2">No items to sell.</p>
              <Link to="/" className="text-primary text-sm hover:underline">Get items from the mystery box →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className={`rounded-xl border-2 ${RARITY_STYLES[item.item_rarity] || "border-border"} bg-secondary/30 p-4 flex flex-col items-center`}>
                  {item.item_icon_url ? (
                    <img src={item.item_icon_url} alt={item.item_name} className="w-14 h-14 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center text-2xl mb-2">📦</div>
                  )}
                  <p className="font-semibold text-sm text-center">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.item_worth || 0} pts</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={selling}
                    onClick={() => handleSell(item)}
                  >
                    Sell
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}