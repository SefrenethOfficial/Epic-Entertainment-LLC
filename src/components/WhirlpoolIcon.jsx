import { motion } from "framer-motion";

export default function WhirlpoolIcon({ size = 20, className = "", color = "text-accent" }) {
  return (
    <div className={`relative ${color} ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="w-full h-full overflow-visible">
        {/* Outer swirling ring */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "20px 20px" }}>
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="22 7" strokeLinecap="round" opacity="0.35" />
        </motion.g>
        {/* Middle ring (reverse spin) */}
        <motion.g animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "20px 20px" }}>
          <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 5" strokeLinecap="round" opacity="0.55" />
        </motion.g>
        {/* Inner fast ring */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "20px 20px" }}>
          <circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="9 3" strokeLinecap="round" opacity="0.8" />
        </motion.g>
        {/* Vortex center */}
        <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.95" />
      </svg>
    </div>
  );
}