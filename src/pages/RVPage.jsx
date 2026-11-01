const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, Radio, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const WALTER_URL = "https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/11f3e2805_image.png";

const QUOTES = [
  "You're in the RV now.",
  "We're not in the desert anymore... or are we?",
  "Chemistry is the study of change.",
  "This is my territory.",
  "Stay out of my territory.",
];

export default function RVPage() {
  const [quote, setQuote] = useState(QUOTES[0]);
  const [driving, setDriving] = useState(false);
  const [radioOn, setRadioOn] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleDrive = () => {
    setDriving(true);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setTimeout(() => setDriving(false), 3000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(to bottom, #2E251E, #1a1410)" }}>
      {/* RV Interior frame — wood paneling */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ceiling */}
        <div className="absolute top-0 left-0 right-0 h-12" style={{ background: "linear-gradient(to bottom, #4A3B2A, #3B2E1E)" }} />
        {/* Side walls (wood paneling) */}
        <div className="absolute top-12 bottom-0 left-0 w-6" style={{ background: "linear-gradient(to right, #3B2E1E, #5A4631)" }} />
        <div className="absolute top-12 bottom-0 right-0 w-6" style={{ background: "linear-gradient(to left, #3B2E1E, #5A4631)" }} />
        {/* Ceiling light */}
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-yellow-200/60" />
      </div>

      {/* Driving shake */}
      <motion.div animate={driving ? { x: [-2, 2, -2], y: [-1, 1, -1] } : {}}
        transition={driving ? { duration: 0.1, repeat: Infinity } : {}}
        className="relative z-10 min-h-screen flex flex-col pt-16 px-6 pb-8">

        {/* Back button */}
        <Link to="/" className="absolute top-3 left-8 z-20">
          <button className="flex items-center gap-2 text-yellow-200/60 hover:text-yellow-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </Link>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-heading text-3xl font-bold text-yellow-100" style={{ textShadow: "2px 2px 0 #5A4631" }}>
            🚐 THE RV
          </h1>
          <p className="text-yellow-200/50 text-sm italic mt-1">"{quote}"</p>
        </div>

        {/* Windshield — desert view */}
        <motion.div
          animate={driving ? { scale: [1, 1.02, 1] } : {}}
          transition={driving ? { duration: 0.3, repeat: Infinity } : {}}
          className="relative flex-1 rounded-2xl overflow-hidden border-4 mx-auto max-w-2xl w-full"
          style={{ borderColor: "#5A4631", minHeight: "200px" }}
        >
          {/* Desert sky */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #C4A04C 0%, #D4B860 40%, #E8C870 70%, #C9A84C 100%)" }} />

          {/* Sun */}
          <div className="absolute top-4 right-12 w-12 h-12 rounded-full bg-yellow-300/80 blur-sm" />

          {/* Desert mountains */}
          <svg className="absolute bottom-0 left-0 w-full h-1/3" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path d="M0,100 L0,60 L80,30 L160,55 L240,25 L320,50 L400,35 L400,100 Z" fill="#8B6B3A" opacity="0.6" />
            <path d="M0,100 L0,75 L60,55 L140,70 L220,50 L300,65 L400,55 L400,100 Z" fill="#6B4F2A" opacity="0.8" />
          </svg>

          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-1/5" style={{ background: "linear-gradient(to bottom, transparent, #4A3B2A)" }} />

          {/* Driving dust particles */}
          {driving && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  initial={{ x: -50, y: 40 + Math.random() * 80 }}
                  animate={{ x: 450 }}
                  transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: i * 0.2 }}
                  className="absolute w-2 h-2 rounded-full bg-yellow-200/30"
                />
              ))}
            </>
          )}

          {/* Walter White portrait on the dashboard */}
          <div className="absolute bottom-2 left-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-yellow-600/50 shadow-lg">
            <img src={WALTER_URL} alt="Walter" className="w-full h-full object-cover" />
          </div>

          {/* Dashboard overlay text */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-yellow-100/70">
            34.0 N · 106.6 W
          </div>
        </motion.div>

        {/* Dashboard controls */}
        <div className="max-w-2xl mx-auto w-full mt-4 flex items-center gap-3">
          {/* Radio */}
          <button onClick={() => setRadioOn(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${radioOn ? "border-yellow-400 bg-yellow-400/10" : "border-yellow-900/50 bg-yellow-900/20"}`}
            style={{ color: "#F5E6C8" }}>
            <Radio className={`w-5 h-5 ${radioOn ? "text-yellow-400" : "text-yellow-200/50"}`} />
            <span className="text-xs font-semibold">{radioOn ? "ON" : "OFF"}</span>
          </button>

          {/* Chemistry set (decorative) */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-yellow-900/50 bg-yellow-900/20" style={{ color: "#F5E6C8" }}>
            <FlaskConical className="w-5 h-5 text-green-400/70" />
            <span className="text-xs font-semibold">99.1%</span>
          </div>

          {/* Drive button */}
          <Button onClick={handleDrive} disabled={driving}
            className="flex-1 gap-2 h-12 border-0"
            style={{ background: driving ? "#5A4631" : "#D4A04C", color: driving ? "#F5E6C8" : "#1a1410" }}>
            <Car className="w-4 h-4" /> {driving ? "Driving..." : "Drive"}
          </Button>
        </div>

        {/* Radio sound bars */}
        <AnimatePresence>
          {radioOn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto w-full mt-3 flex items-end justify-center gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div key={i}
                  animate={{ height: [4, 10 + Math.random() * 16, 4] }}
                  transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                  className="w-1.5 rounded-full bg-yellow-400/60"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}