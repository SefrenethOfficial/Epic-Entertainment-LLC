import React from "react";
import { Gamepad2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Gamepad2 className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
        No games yet
      </h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        Add your first HTML game or embed link to start building your arcade.
      </p>
      <Button onClick={onAdd} size="lg" className="gap-2">
        <Plus className="w-5 h-5" /> Add Your First Game
      </Button>
    </motion.div>
  );
}