import React, { useState } from "react";
import { X, ExternalLink, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  // Handle youtu.be short links
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // Handle watch?v=
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // Handle playlist
  const playlistMatch = url.match(/[?&]list=([^&]+)/);
  if (playlistMatch) return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  // Already an embed URL
  if (url.includes("youtube.com/embed")) return url;
  return url;
}

export default function VideoPlayer({ video, onClose }) {
  if (!video) return null;

  // Drive folder — embed inside the app
  if (video.video_type === "drive_folder") {
    // Convert drive folder URL to embeddable URL
    const getDriveEmbedUrl = (url) => {
      if (!url) return null;
      // Already an embed URL
      if (url.includes("/embeddedfolderview")) return url;
      // Extract folder ID from various Drive URL formats
      const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
      // id= param
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) return `https://drive.google.com/embeddedfolderview?id=${idMatch[1]}#list`;
      return url;
    };

    const embedUrl = getDriveEmbedUrl(video.drive_folder_url);

    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎌</span>
            <h2 className="font-heading font-semibold text-foreground text-sm truncate">{video.title}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(video.drive_folder_url, "_blank")} title="Open in Google Drive">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full flex-1 border-0 bg-white"
            allowFullScreen
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white">
            <p>Invalid Google Drive folder URL.</p>
          </div>
        )}
      </div>
    );
  }

  // MP3 / MP4 player
  if (video.video_type === "mp3") {
    const isVideoFile = video.mp3_url && /\.(mp4|mov|webm|mkv|avi)(\?|$)/i.test(video.mp3_url);
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className={`bg-card border border-border rounded-2xl w-full p-6 text-center space-y-4 shadow-2xl ${isVideoFile ? "max-w-3xl" : "max-w-lg"}`}>
          {!isVideoFile && <div className="text-5xl">🎵</div>}
          <h2 className="font-heading text-2xl font-bold text-foreground">{video.title}</h2>
          {video.description && (
            <p className="text-muted-foreground text-sm">{video.description}</p>
          )}
          {isVideoFile ? (
            <video controls src={video.mp3_url} className="w-full rounded-xl max-h-[60vh]" autoPlay />
          ) : (
            <audio controls src={video.mp3_url} className="w-full rounded" autoPlay />
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // YouTube embed
  const embedUrl = getYouTubeEmbedUrl(video.youtube_url);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <h2 className="font-heading font-semibold text-white text-sm truncate">{video.title}</h2>
        <div className="flex gap-2">
          {video.youtube_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => window.open(video.youtube_url, "_blank")}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={video.title}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-white">
          <p>Invalid or unsupported YouTube URL.</p>
        </div>
      )}
    </div>
  );
}