const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, Factory, Printer, Lock, Timer, Fish } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LayerPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [printing, setPrinting] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setUserProfile(profiles[0]);
    }
    load();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastPrint = userProfile?.last_print_time ? new Date(userProfile.last_print_time).getTime() : 0;
  const cooldownEnd = lastPrint + 60000;
  const inCooldown = now < cooldownEnd;
  const cooldownRemaining = Math.ceil((cooldownEnd - now) / 1000);

  const bannedUntil = userProfile?.layer_banned_until ? new Date(userProfile.layer_banned_until).getTime() : 0;
  const isBanned = now < bannedUntil;
  const bannedRem = bannedUntil - now;
  const bh = Math.floor(bannedRem / 3600000);
  const bm = Math.floor((bannedRem % 3600000) / 60000);
  const bs = Math.floor((bannedRem % 60000) / 1000);

  const handleConvertBread = async () => {
    if (!userProfile || (userProfile.bread_points || 0) < 10 || converting) return;
    setConverting(true);
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      bread_points: (userProfile.bread_points || 0) - 10,
      fish_count: (userProfile.fish_count || 0) + 1,
    });
    setUserProfile(updated);
    setConverting(false);
  };

  const handlePrint = async () => {
    if (inCooldown || isBanned || !userProfile) return;
    setPrinting(true);
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      epicbucks: (userProfile.epicbucks || 0) + 100,
      last_print_time: new Date().toISOString(),
    });
    setUserProfile(updated);
    setTimeout(() => setPrinting(false), 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-bold text-foreground">The Layer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Balance */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-4xl">💵</span>
          <div>
            <p className="text-3xl font-heading font-bold text-foreground">{(userProfile?.epicbucks || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">EpicBucks</p>
          </div>
        </div>

        {isBanned ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-8 text-center">
            <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-destructive mb-2">Busted!</h2>
            <p className="text-sm text-muted-foreground mb-4">A detective caught you printing. The Layer is locked.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border">
              <Timer className="w-4 h-4 text-destructive" />
              <span className="font-heading font-bold text-destructive">{bh}h {bm}m {bs}s</span>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-border bg-gradient-to-b from-secondary to-card p-8">
            {/* Factory visual */}
            <div className="relative h-40 rounded-xl bg-background/50 border border-border overflow-hidden mb-6 flex items-center justify-center">
              <motion.div animate={{ rotate: printing ? 360 : 0 }} transition={{ duration: 1, repeat: printing ? Infinity : 0, ease: "linear" }}
                className="absolute left-8 top-8 text-4xl opacity-40">⚙️</motion.div>
              <motion.div animate={{ rotate: printing ? -360 : 0 }} transition={{ duration: 1.5, repeat: printing ? Infinity : 0, ease: "linear" }}
                className="absolute right-8 bottom-8 text-5xl opacity-30">⚙️</motion.div>
              <motion.div animate={{ y: printing ? [0, -8, 0] : 0 }} transition={{ duration: 0.5, repeat: printing ? Infinity : 0 }}
                className="text-6xl">🖨️</motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-secondary border-t border-border">
                <motion.div animate={{ x: [0, 40, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-full w-8 bg-primary/20" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {inCooldown ? "Press cooling down..." : "Press ready to print 100 💵"}
              </p>
              <Button onClick={handlePrint} disabled={inCooldown}
                size="lg" className="gap-2 h-14 px-10 text-lg font-heading">
                <Printer className="w-5 h-5" />
                {inCooldown ? `Cooldown: ${cooldownRemaining}s` : "Print 100 💵"}
              </Button>
              {inCooldown && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${100 - (cooldownRemaining / 60) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-6 rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Watch out — detectives can suspect you if you've printed in the last hour.
            Get caught and you lose 50 💵 plus a 4-hour ban from the Layer.
          </p>
        </div>

        {/* Bread Points → Fish conversion */}
        <div className="mt-6 rounded-2xl border-2 border-amber-700/40 bg-amber-700/5 p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🍞</span>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{(userProfile?.bread_points || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Bread Points</p>
            </div>
            <span className="text-2xl text-muted-foreground">→</span>
            <span className="text-3xl">🐟</span>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Convert Bread Points from the Realm of Bread into Fish. 10 🍞 = 1 🐟
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleConvertBread}
              disabled={!userProfile || (userProfile.bread_points || 0) < 10 || converting}
              variant="outline"
              className="gap-2 border-amber-700/40 hover:bg-amber-700/10"
            >
              <Fish className="w-4 h-4" />
              {converting ? "Converting..." : "Convert 10 🍞 → 1 🐟"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}