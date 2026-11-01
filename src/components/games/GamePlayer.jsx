import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Maximize, Minimize, Pause, Play, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

// Diamond milestone every 10 minutes
const DIAMOND_INTERVAL_MS = 10 * 60 * 1000;

// In-game diamond notification
function DiamondToast({ count, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2"
      initial={{ y: 40, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/95 border border-primary/40 shadow-2xl backdrop-blur-xl">
        <span className="text-3xl">💎</span>
        <div>
          <p className="font-heading font-bold text-foreground text-sm">+1 Diamond!</p>
          <p className="text-xs text-muted-foreground">{count * 10} min milestone reached</p>
        </div>
      </div>
    </motion.div>);

}

export default function GamePlayer({ game, onClose, onDiamondEarned }) {
  const containerRef = useRef(null);
  const dragControls = useDragControls();
  const iframeRef = useRef(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(null);
  const [toast, setToast] = useState(null); // { count }
  const milestoneRef = useRef(1); // next milestone count

  // Fire diamonds every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const count = milestoneRef.current;
      milestoneRef.current += 1;
      setToast({ count });
      onDiamondEarned?.();
    }, DIAMOND_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [onDiamondEarned]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", handleKey);
    const handleFSChange = () => setIsNativeFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", handleFSChange);
    };
  }, [onClose]);

  useEffect(() => {
    if (game.type === "embed") {
      setIframeSrc(game.embed_url);
    } else if (game.html_code) {
      const blob = new Blob([game.html_code], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setIframeSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [game]);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();else
    document.exitFullscreen?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}>
        
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }} />
        

        <motion.div
          ref={containerRef}
          className="relative w-full h-full bg-black flex flex-col"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          
          {/* Draggable controller */}
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={containerRef}
            initial={{ x: 16, y: 16 }}
            className="absolute top-4 left-4 z-20 flex items-center gap-0.5 p-1.5 rounded-2xl border border-border shadow-2xl backdrop-blur-xl">
            
            <div onPointerDown={(e) => dragControls.start(e)} className="w-7 h-9 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground touch-none">
              <GripVertical className="w-4 h-4" />
            </div>
            <button onClick={() => setPaused((p) => !p)} className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button onClick={toggleNativeFullscreen} className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
              {isNativeFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Pause overlay */}
          <AnimatePresence>
            {paused &&
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              
                <Pause className="w-10 h-10 text-white/80" />
                <h2 className="font-heading text-xl font-bold text-white">{game.title}</h2>
                <p className="text-white/50 text-sm">Paused</p>
                <Button onClick={() => setPaused(false)} size="lg" className="gap-2 mt-2">
                  <Play className="w-4 h-4" /> Resume
                </Button>
              </motion.div>
            }
          </AnimatePresence>

          {iframeSrc &&
          <motion.iframe
            ref={iframeRef}
            src={iframeSrc}
            title={game.title}
            className="w-full h-full border-0"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
            allowFullScreen
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }} />

          }
        </motion.div>

        {/* Diamond toast notification */}
        <AnimatePresence>
          {toast &&
          <DiamondToast
            key={toast.count}
            count={toast.count}
            onDone={() => setToast(null)} />

          }
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>);

}