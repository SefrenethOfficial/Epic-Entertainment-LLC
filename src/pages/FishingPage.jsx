const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import FishingGame from "@/components/games/FishingGame";
import RodShop from "@/components/games/RodShop";
import WhirlpoolIcon from "@/components/WhirlpoolIcon";
import { getRod } from "@/components/games/rods";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const WALTER_URL = "https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/11f3e2805_image.png";

function DockAvatar({ profile }) {
  const { avatar, avatar_url } = profile || {};
  if ((avatar === "custom" || (avatar && avatar.startsWith("custom_db_"))) && avatar_url)
    return <img src={avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40" />;
  return <img src={LOGO_URL} alt="avatar" className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary/40" />;
}

export default function FishingPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [showGame, setShowGame] = useState(false);
  const [catchToast, setCatchToast] = useState(null);
  const [buyMsg, setBuyMsg] = useState(null);

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setUserProfile(profiles[0]);
    }
    load();
  }, []);

  const equippedRodId = userProfile?.fishing_rod || "basic";
  const ownedRodIds = userProfile?.owned_fishing_rods || ["basic"];
  const equippedRod = getRod(equippedRodId);

  const handleCatch = async (fish) => {
    if (!userProfile) return;
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      fish_count: (userProfile.fish_count || 0) + 1,
      fish_points: (userProfile.fish_points || 0) + fish.fishPoints,
    });
    setUserProfile(updated);
    setCatchToast(fish);
    setTimeout(() => setCatchToast(null), 2800);
  };

  const handleBuy = async (rod) => {
    if (!userProfile) return;
    const cost = rod.currency === "points" ? rod.price : rod.price;
    const canAfford = rod.currency === "points" ? (userProfile.points || 0) >= cost : (userProfile.diamonds || 0) >= cost;
    if (!canAfford) return;
    const updateData = {
      owned_fishing_rods: [...(userProfile.owned_fishing_rods || ["basic"]), rod.id],
      fishing_rod: rod.id,
    };
    if (rod.currency === "points") updateData.points = (userProfile.points || 0) - cost;
    else updateData.diamonds = (userProfile.diamonds || 0) - cost;
    const updated = await db.entities.UserProfile.update(userProfile.id, updateData);
    setUserProfile(updated);
    setBuyMsg(`Equipped ${rod.name}!`);
    setTimeout(() => setBuyMsg(null), 2000);
  };

  const handleEquip = async (rod) => {
    if (!userProfile) return;
    const updated = await db.entities.UserProfile.update(userProfile.id, { fishing_rod: rod.id });
    setUserProfile(updated);
    setBuyMsg(`Equipped ${rod.name}!`);
    setTimeout(() => setBuyMsg(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎣</span>
            <h1 className="font-heading text-lg font-bold text-foreground">Fishing Lake</h1>
          </div>
          <Link to="/leaderboard">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Records
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-6 py-4">
          <div className="flex flex-col items-center">
            <span className="text-3xl">🎣</span>
            <span className="text-xl font-heading font-bold text-foreground mt-1">{userProfile?.fish_count || 0}</span>
            <span className="text-xs text-muted-foreground">Fish Caught</span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-3xl">🐟</span>
            <span className="text-xl font-heading font-bold text-accent mt-1">{(userProfile?.fish_points || 0).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Fish Points</span>
          </div>
        </motion.div>

        {/* Lake scene with dock + avatar */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="relative h-72 rounded-2xl overflow-hidden border-2 border-border">
          {/* Sky / water gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary to-card" />
          {/* Water surface shimmer */}
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-1.5 bg-primary/20" />
          {/* Swimming fish silhouettes */}
          <motion.div animate={{ x: [-30, 400, -30] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 text-2xl opacity-20">🐟</motion.div>
          <motion.div animate={{ x: [400, -30, 400] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            className="absolute top-24 text-xl opacity-15">🐠</motion.div>

          {/* Whirlpool in the water */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <WhirlpoolIcon size={56} />
          </div>

          {/* Fishing line from avatar to whirlpool */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <line x1="50%" y1="78%" x2="50%" y2="50%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
          </svg>

          {/* Dock */}
          <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: "linear-gradient(to bottom, #5A4631, #3B2E1E)" }}>
            {/* Plank lines */}
            <div className="absolute inset-0 flex flex-col justify-around opacity-30">
              <div className="h-px bg-black/40" />
              <div className="h-px bg-black/40" />
              <div className="h-px bg-black/40" />
            </div>
          </div>

          {/* Avatar standing on dock */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <DockAvatar profile={userProfile} />
            {/* Fishing rod */}
            <div className="text-2xl -mt-2 -ml-6">🎣</div>
          </div>
        </motion.div>

        {/* Cast button */}
        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => setShowGame(true)} size="lg" className="gap-2 h-14 px-10 text-lg">
            🎣 Cast Line
          </Button>
          <p className="text-muted-foreground text-xs">Using: <span className="text-foreground font-semibold">{equippedRod.name}</span></p>
        </div>

        {/* Rod Shop */}
        <RodShop
          ownedRodIds={ownedRodIds}
          equippedRodId={equippedRodId}
          userPoints={userProfile?.points || 0}
          userDiamonds={userProfile?.diamonds || 0}
          onBuy={handleBuy}
          onEquip={handleEquip}
        />
      </main>

      {/* Catch toast */}
      <AnimatePresence>
        {catchToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-accent/40 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl">
            <span className="text-4xl">{catchToast.emoji}</span>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">Caught a {catchToast.name}!</p>
              <p className="text-xs text-accent font-semibold">+{catchToast.fishPoints} 🐟 fish pts</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy/equip toast */}
      <AnimatePresence>
        {buyMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg">
            {buyMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Walter White — hidden RV secret (bottom-left corner) */}
      <Link to="/rv" className="fixed bottom-5 left-5 z-30 group">
        <img src={WALTER_URL} alt="Walter"
          className="w-12 h-12 rounded-lg object-cover shadow-2xl border-2 border-yellow-700/40 opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:border-yellow-500 transition-all duration-200" />
      </Link>

      {showGame && <FishingGame rodId={equippedRodId} onCatch={handleCatch} onClose={() => setShowGame(false)} />}
    </div>
  );
}