import React from "react";
import { Play, Trash2, Pencil, FolderOpen, Music, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryIcons = {
  anime: "🎌",
  movie: "🎬",
  series: "📺",
  music: "🎵",
  other: "📁",
};

const typeIcon = {
  youtube: <Youtube className="w-3.5 h-3.5" />,
  drive_folder: <FolderOpen className="w-3.5 h-3.5" />,
  mp3: <Music className="w-3.5 h-3.5" />,
};

const typeLabel = {
  youtube: "YouTube",
  drive_folder: "Drive Folder",
  mp3: "MP3",
};

export default function VideoCard({ video, onPlay, onEdit, onDelete, isEditor }) {
  const icon = categoryIcons[video.category] || "📁";

  return (
    <div className="group relative bg-card/70 rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative h-44 bg-secondary overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 via-secondary to-primary/10">
            <span className="text-5xl">{icon}</span>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            onClick={() => onPlay(video)}
            size="lg"
            className="bg-accent hover:bg-accent/90 rounded-full w-14 h-14 p-0 shadow-lg shadow-accent/30"
          >
            {video.video_type === "drive_folder" ? (
              <FolderOpen className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-gradient-to-t from-card/60 to-card backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-foreground truncate">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs text-muted-foreground capitalize">
              {icon} {video.category || "other"}
            </Badge>
            <Badge variant="outline" className="text-xs text-accent gap-1 flex items-center">
              {typeIcon[video.video_type]}
              {typeLabel[video.video_type]}
            </Badge>
          </div>
          {isEditor && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(video)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(video)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}