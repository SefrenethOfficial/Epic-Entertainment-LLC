import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

export default function StreakToast({ streak, bonusPoints, bonusDiamonds, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-6 left-1/2 z-[100] -translate-x-1/2"
        initial={{ y: -60, opacity: 0, scale: 0.85 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -40, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-card/95 border border-orange-400/40 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20">
            <Flame className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <p className="font-heading font-bold text-foreground text-base">
              🔥 {streak}-Day Streak!
            </p>
            <p className="text-sm text-muted-foreground">
              Bonus: <span className="text-primary font-semibold">+{bonusPoints} pts</span>
              {bonusDiamonds > 0 && (
                <span className="text-cyan-400 font-semibold"> · +{bonusDiamonds} 💎</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}