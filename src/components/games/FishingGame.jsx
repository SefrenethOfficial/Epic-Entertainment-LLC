import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getRod, pickFish, RARITY_COLORS } from "./rods";
import WhirlpoolIcon from "@/components/WhirlpoolIcon";

export default function FishingGame({ rodId, onCatch, onClose }) {
  const rod = getRod(rodId);
  const [phase, setPhase] = useState("casting");
  const [power, setPower] = useState(0);
  const [result, setResult] = useState(null);

  // Cast power oscillation
  const powerDirRef = useRef(1);

  // Reel physics refs
  const fishYRef = useRef(50);
  const fishTargetRef = useRef(50);
  const zoneYRef = useRef(50);
  const zoneVelRef = useRef(0);
  const progressRef = useRef(50);
  const isHoldingRef = useRef(false);
  const castBoostRef = useRef(0);

  // Reel display state
  const [fishY, setFishY] = useState(50);
  const [zoneY, setZoneY] = useState(50);
  const [progress, setProgress] = useState(50);
  const [isHolding, setIsHolding] = useState(false);

  const waitTimer = useRef(null);
  const biteTimer = useRef(null);
  const loopRef = useRef(null);

  const clearAll = useCallback(() => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    if (biteTimer.current) clearTimeout(biteTimer.current);
    if (loopRef.current) clearInterval(loopRef.current);
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  // ── CASTING: oscillating power meter ──
  useEffect(() => {
    if (phase !== "casting") return;
    const loop = setInterval(() => {
      setPower(p => {
        let np = p + powerDirRef.current * 3.5;
        if (np >= 100) { np = 100; powerDirRef.current = -1; }
        if (np <= 0) { np = 0; powerDirRef.current = 1; }
        return np;
      });
    }, 25);
    return () => clearInterval(loop);
  }, [phase]);

  const lockCast = () => {
    castBoostRef.current = (power / 100) * 20;
    setPhase("waiting");
    const delay = 1200 + (100 - power) * 15 + Math.random() * 2000;
    waitTimer.current = setTimeout(() => {
      setPhase("biting");
      biteTimer.current = setTimeout(() => {
        setPhase("result");
        setResult({ fish: null, success: false, escaped: true });
      }, 1600);
    }, delay);
  };

  const startReel = () => {
    if (phase !== "biting") return;
    if (biteTimer.current) clearTimeout(biteTimer.current);
    // Reset reel state
    fishYRef.current = 50;
    fishTargetRef.current = 50;
    zoneYRef.current = 50;
    zoneVelRef.current = 0;
    progressRef.current = 40;
    setFishY(50); setZoneY(50); setProgress(40);
    setPhase("reeling");
  };

  // ── REELING: Stardew-style tension mini-game ──
  useEffect(() => {
    if (phase !== "reeling") return;

    let lastTarget = Date.now();

    loopRef.current = setInterval(() => {
      // Fish AI — pick new targets periodically
      if (Date.now() - lastTarget > 600 + Math.random() * 900) {
        fishTargetRef.current = 8 + Math.random() * 84;
        lastTarget = Date.now();
      }
      const fishDy = fishTargetRef.current - fishYRef.current;
      fishYRef.current += Math.sign(fishDy) * Math.min(Math.abs(fishDy), rod.fishSpeed);
      fishYRef.current = Math.max(2, Math.min(98, fishYRef.current));

      // Zone physics — holding pulls up, gravity pulls down
      if (isHoldingRef.current) {
        zoneVelRef.current -= rod.pullForce;
      }
      zoneVelRef.current += rod.gravity;
      zoneVelRef.current *= 0.9; // damping
      zoneYRef.current += zoneVelRef.current;

      const half = rod.zoneSize / 2;
      if (zoneYRef.current < half) { zoneYRef.current = half; zoneVelRef.current = 0; }
      if (zoneYRef.current > 100 - half) { zoneYRef.current = 100 - half; zoneVelRef.current = 0; }

      // Progress — fill when fish in zone, drain when not
      const inZone = Math.abs(fishYRef.current - zoneYRef.current) < half;
      progressRef.current += inZone ? rod.fillRate : -rod.drainRate;

      // Sync display
      setFishY(fishYRef.current);
      setZoneY(zoneYRef.current);
      setProgress(progressRef.current);

      // Win / lose
      if (progressRef.current >= 100) {
        clearAll();
        const fish = pickFish(rod.rarityBoost + castBoostRef.current);
        setPhase("result");
        setResult({ fish, success: true });
        onCatch(fish);
      } else if (progressRef.current <= 0) {
        clearAll();
        setPhase("result");
        setResult({ fish: null, success: false, escaped: true });
      }
    }, 40);

    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [phase, rod, onCatch, clearAll]);

  const holdStart = () => { isHoldingRef.current = true; setIsHolding(true); };
  const holdEnd = () => { isHoldingRef.current = false; setIsHolding(false); };

  const reset = () => {
    clearAll();
    setPhase("casting");
    setPower(0);
    setResult(null);
    powerDirRef.current = 1;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <button onClick={() => { clearAll(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground text-xl z-10">✕</button>

      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        {/* Rod indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border">
          <span className="text-sm">{rod.emoji}</span>
          <span className="text-xs font-semibold text-foreground">{rod.name}</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── CASTING: Power meter ── */}
          {phase === "casting" && (
            <motion.div key="casting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-muted-foreground text-center">Click to set cast power.<br/>Higher power = rarer fish!</p>
              {/* Power bar */}
              <div className="relative w-full h-8 rounded-lg bg-secondary border border-border overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/40 via-yellow-500/50 to-primary/60" style={{ width: `${power}%` }} />
                {/* Sweet spot marker */}
                <div className="absolute inset-y-0 w-1 bg-green-400" style={{ left: "80%" }} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {Math.round(power)}%
                </div>
              </div>
              <Button onClick={lockCast} size="lg" className="gap-2 h-12 px-8">🎯 Cast!</Button>
            </motion.div>
          )}

          {/* ── WAITING ── */}
          {phase === "waiting" && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              {/* Mini lake scene */}
              <div className="relative w-64 h-32 rounded-xl bg-gradient-to-b from-secondary to-card border border-border overflow-hidden">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-0 left-0 right-0 h-1 bg-primary/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-24 bg-primary/20" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-destructive" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <WhirlpoolIcon size={32} />
                </div>
              </div>
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-3xl">🫧</motion.div>
              <p className="text-sm text-muted-foreground">Waiting for a bite...</p>
            </motion.div>
          )}

          {/* ── BITING: Quick reaction ── */}
          {phase === "biting" && (
            <motion.div key="biting" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <motion.p animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.2, repeat: Infinity }} className="text-5xl font-heading font-bold text-yellow-400">!</motion.p>
              <p className="text-sm text-yellow-400/80 font-semibold">FISH ON THE LINE!</p>
              <Button onClick={startReel} size="lg"
                className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black h-14 px-10 text-lg font-bold animate-pulse">
                🪝 REEL!
              </Button>
            </motion.div>
          )}

          {/* ── REELING: Tension mini-game ── */}
          {phase === "reeling" && (
            <motion.div key="reeling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 w-full">
              <p className="text-xs text-muted-foreground text-center">HOLD to pull up — keep the 🐟 inside the green zone!</p>
              <div className="flex gap-3 justify-center">
                {/* Fish track */}
                <div className="relative w-14 h-48 rounded-lg bg-secondary border border-border overflow-hidden">
                  {/* Catch zone */}
                  <div className="absolute left-0 right-0 bg-green-500/25 border-y-2 border-green-400"
                    style={{ height: `${rod.zoneSize}%`, top: `${zoneY - rod.zoneSize / 2}%` }} />
                  {/* Fish */}
                  <div className="absolute left-1/2 -translate-x-1/2 text-lg" style={{ top: `calc(${fishY}% - 10px)` }}>🐟</div>
                </div>
                {/* Progress bar */}
                <div className="relative w-5 h-48 rounded-lg bg-secondary border border-border overflow-hidden">
                  <div className={`absolute bottom-0 left-0 right-0 transition-all ${progress > 70 ? "bg-green-500" : progress > 30 ? "bg-primary" : "bg-destructive"}`}
                    style={{ height: `${Math.max(0, Math.min(100, progress))}%` }} />
                </div>
              </div>
              <Button
                onMouseDown={holdStart} onMouseUp={holdEnd} onMouseLeave={holdEnd}
                onTouchStart={holdStart} onTouchEnd={holdEnd}
                size="lg" className={`gap-2 h-12 px-10 ${isHolding ? "bg-primary scale-95" : ""}`}>
                {isHolding ? "⬆️ PULLING" : "🪝 HOLD TO REEL"}
              </Button>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              {result.success ? (
                <>
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="text-7xl">{result.fish.emoji}</motion.div>
                  <p className="text-xl font-heading font-bold text-foreground">Caught a {result.fish.name}!</p>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${RARITY_COLORS[result.fish.rarity]}`}>{result.fish.rarity}</span>
                    <span className="text-sm text-accent font-bold">+{result.fish.fishPoints} 🐟 pts</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl">💨</div>
                  <p className="text-xl font-heading font-bold text-muted-foreground">The fish got away!</p>
                  <p className="text-sm text-muted-foreground/70">Better luck next cast.</p>
                </>
              )}
              <Button onClick={reset} size="lg" className="gap-2 h-11 px-6 mt-1">🎣 Cast Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}