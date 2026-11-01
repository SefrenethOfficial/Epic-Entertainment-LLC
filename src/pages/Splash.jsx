const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, Eye } from "lucide-react";
import BreakingNewsBar from "@/components/BreakingNewsBar";

const DEFAULT_MESSAGES = [
"Welcome back, Player.",
"Ready to play?",
"Your games await.",
"Let's get into it.",
"What are we playing today?"];

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  dur: Math.random() * 4 + 3,
  delay: Math.random() * 3
}));

/**
 * Splash screen shown on first load.
 * Props:
 *   onEnter: called when user clicks Enter
 *   sidebarContent: optional JSX — pre-opened sidebar panel shown without blur backdrop
 */
export default function Splash({ onEnter, sidebarContent, onDetective, isEditor, onMysteryBox }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function loadMessage() {
      try {
        const settings = await db.entities.SiteSettings.list();
        const msgs =
        settings?.[0]?.messages?.length > 0 ?
        settings[0].messages :
        DEFAULT_MESSAGES;
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      } catch {
        setMessage(DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)]);
      }
    }
    loadMessage();
  }, []);

  const handleEnter = () => {
    setVisible(false);
    setTimeout(onEnter, 700);
  };

  return (
    <AnimatePresence>
      {visible &&
      <>
        {/* Breaking news bar — top */}
        <BreakingNewsBar isEditor={isEditor} />
        {/* Auto-opened sidebar preview — above splash */}
        {sidebarContent}
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(225,25%,6%)" }}>
          
          {/* Animated particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) =>
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-primary/30"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }} />

            )}
          </div>

          {/* Glow blob */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

          {/* Logo + title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 mb-10">
            
            <div className="relative">
              <span className="absolute -top-6 left-1/2 text-5xl leading-none z-10 select-none pointer-events-none" style={{ transform: "translateX(-50%)" }}>🎩</span>
              <img
                src="https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png"
                alt="Logo"
                className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-primary/30" />
              
            </div>
            <h1 className="text-4xl sm:text-5xl text-foreground tracking-tight [font-family:'Minecraft',_sans-serif] font-normal mx-1 my-2">Epic Entertainment LLC

            </h1>
          </motion.div>

          {/* Random message */}
          <AnimatePresence mode="wait">
            {message &&
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-muted-foreground text-lg sm:text-xl mb-12 font-body italic">
              
                "{message}"
              </motion.p>
            }
          </AnimatePresence>

          {/* Play button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnter}
            className="relative w-24 h-24 rounded-full font-heading font-bold text-white bg-primary shadow-2xl shadow-primary/50 hover:bg-primary/90 transition-colors overflow-hidden group flex items-center justify-center">
            
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 ml-1.5">
              <path d="M8 5v14l11-7z" />
            </svg>
            <motion.div className="absolute inset-0 group-hover:opacity-100 transition-opacity rounded-full bg-[#ffffff]/[0.1] opacity-40" />
          </motion.button>

          {/* Secondary buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="flex items-center gap-4 mt-6">
            
            <a
              href="#/leaderboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-sm font-semibold text-foreground transition-colors backdrop-blur-sm">
              
              🏆 Leaderboard
            </a>
            <a
              href="#/shop"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-sm font-semibold text-foreground transition-colors backdrop-blur-sm">
              
              🛍️ Shop
            </a>
          </motion.div>

          {/* My Avatar button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="mt-3">
            
            <a
              href="#/avatar"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-sm font-semibold text-foreground transition-colors backdrop-blur-sm">
              
              🎭 My Avatar
            </a>
          </motion.div>

          {/* Quick-access icons — bottom-left */}
          <div className="fixed bottom-5 left-5 z-50 flex items-end gap-2">
            <a href="#/layer" className="group">
              <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-50 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-primary">
                <Factory className="w-5 h-5 text-foreground" />
              </div>
            </a>
            <a href="#/jeweler" className="group">
              <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-50 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-cyan-400">
                <span className="text-lg">💎</span>
              </div>
            </a>
            <a href="#/inventory" className="group">
              <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-50 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-green-400">
                <span className="text-lg">🎒</span>
              </div>
            </a>
            {/* Trade stacked above Mystery Box */}
            <div className="flex flex-col gap-2">
              <a href="#/trading" className="group" title="Trading Post">
                <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-50 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-yellow-400 pr-5 pl-5 mx-12">
                  <span className="text-lg">🔄</span>
                </div>
              </a>
              <button
                onClick={() => {onEnter();if (onMysteryBox) setTimeout(onMysteryBox, 800);}}
                className="group"
                title="Mystery Box">
                
                <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-50 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-purple-400 mx-12">
                  <span className="text-lg">🎁</span>
                </div>
              </button>
            </div>
          </div>

          {/* Detective — top-right corner */}
          <button onClick={onDetective} className="fixed top-5 right-5 z-50 group">
            <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-destructive text-[#b30f0f] opacity-100">
              <Eye className="w-5 h-5 text-foreground" />
            </div>
          </button>

          {/* Poster — bottom right corner */}
          <a href="#/poster" className="fixed bottom-20 right-5 z-50 group">
            <img
              src="https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/552b74388_image.png"
              alt="Poster"
              className="w-14 sm:w-16 shadow-2xl border-2 border-yellow-400/60 group-hover:scale-105 group-hover:border-yellow-400 transition-all duration-200 rounded-lg" />
            
          </a>

        </motion.div>
        {/* Bread — dejected on the floor below the poster */}
        <a href="#/bread" className="fixed bottom-1 right-5 z-[60] group p-1.5" title="Realm of Bread">
          <span className="text-3xl opacity-30 hover:opacity-100 transition-all inline-block group-hover:scale-110" style={{ transform: "rotate(25deg)" }}>🍞</span>
        </a>
        </>
      }
    </AnimatePresence>);

}