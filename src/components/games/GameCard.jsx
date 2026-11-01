import React, { useState } from "react";
import { Play, Trash2, Pencil, GripVertical, Heart, Flame, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CommentsSection from "@/components/CommentsSection";

const categoryIcons = {
  action: "🎯",
  puzzle: "🧩",
  arcade: "👾",
  strategy: "♟️",
  casual: "🎮",
  other: "🕹️",
};

export default function GameCard({ game, onPlay, onEdit, onDelete, dragHandleProps, isEditor, isFavorite, onToggleFavorite, isTrending }) {
  const [showComments, setShowComments] = useState(false);
  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-300">
      {/* Thumbnail / Placeholder */}
      <div className="relative h-44 bg-secondary overflow-hidden">
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary to-accent/10">
            <span className="text-5xl">{categoryIcons[game.category] || "🕹️"}</span>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            onClick={() => onPlay(game)}
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-full w-14 h-14 p-0 shadow-lg shadow-primary/30"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>

        {/* Drag handle — editors only */}
        {isEditor && (
          <div
            {...dragHandleProps}
            className="absolute top-2 left-2 p-1 rounded bg-black/50 backdrop-blur-sm text-white/70 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Trending badge */}
        {isTrending && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold">
            <Flame className="w-3 h-3" /> Hot
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-foreground truncate">{game.title}</h3>
            {game.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{game.description}</p>
            )}
          </div>
          {/* Favorite button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(game.id); }}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
              isFavorite ? "text-rose-400 bg-rose-400/10 hover:bg-rose-400/20" : "text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs text-muted-foreground capitalize">
              {categoryIcons[game.category] || "🕹️"} {game.category || "other"}
            </Badge>
            {(game.play_count || 0) > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Play className="w-2.5 h-2.5" /> {(game.play_count || 0).toLocaleString()}
              </span>
            )}
          </div>
          {isEditor && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(game)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(game)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Comments toggle button */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {showComments ? "Hide comments" : "Comments"}
        </button>

        {/* Collapsible comments section */}
        {showComments && <CommentsSection targetType="game" targetId={game.id} />}
      </div>
    </div>
  );
}