const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const RARITY_STYLES = {
  common: { border: "border-gray-500", text: "text-gray-400", bg: "bg-gray-500/10" },
  uncommon: { border: "border-green-500", text: "text-green-400", bg: "bg-green-500/10" },
  rare: { border: "border-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
  epic: { border: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
  legendary: { border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10" },
};

export default function InventoryPage() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    db.auth.me().then((u) => setUserId(u.id || ""));
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory", userId],
    queryFn: () => db.entities.InventoryItem.filter({ user_id: userId }, "-created_date"),
    enabled: !!userId,
  });

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
          <h1 className="font-heading text-xl font-bold">🎒 Inventory</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎒</div>
            <h3 className="font-heading text-xl font-bold mb-2">Your inventory is empty</h3>
            <p className="text-muted-foreground mb-4">Open the mystery box on the home page to get items!</p>
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              🎁 Get Items
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground text-sm">{items.length} item{items.length !== 1 ? "s" : ""}</p>
              <Link to="/jeweler" className="text-sm text-primary hover:underline">💎 Visit Jeweler</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => {
                const style = RARITY_STYLES[item.item_rarity] || RARITY_STYLES.common;
                return (
                  <div key={item.id} className={`rounded-xl border-2 ${style.border} ${style.bg} bg-card p-4 flex flex-col items-center`}>
                    {item.item_icon_url ? (
                      <img src={item.item_icon_url} alt={item.item_name} className="w-16 h-16 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-3xl mb-2">📦</div>
                    )}
                    <p className="font-semibold text-sm text-center">{item.item_name}</p>
                    <p className={`text-xs font-bold uppercase mt-1 ${style.text}`}>{item.item_rarity}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.item_worth || 0} pts</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}