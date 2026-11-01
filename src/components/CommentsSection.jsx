const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

// Small avatar renderer for comment authors
function CommentAvatar({ avatar, avatarUrl }) {
  if ((avatar === "custom" || avatar?.startsWith("custom_db_")) && avatarUrl)
    return <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="avatar" />;
  return <img src={LOGO_URL} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="avatar" />;
}

// Formats a date string to a readable relative/absolute label
function formatCommentDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/**
 * CommentsSection — reusable comment thread component.
 * Props:
 *   targetType: "news" | "game" | "profile"
 *   targetId: string — ID of the entity being commented on
 */
export default function CommentsSection({ targetType, targetId }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Load the current user's auth info and profile on mount
  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      setIsEditor(EDITOR_EMAILS.includes(user.email) || user.role === "admin");
      // Fetch the user's profile for display name + avatar
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      setCurrentUser({ ...user, profile: profiles[0] || null });
    }
    load();
  }, []);

  // Fetch all comments for this specific target
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: () => db.entities.Comment.filter({ target_type: targetType, target_id: targetId }, "-created_date"),
    enabled: !!targetId,
  });

  // Submit a new comment
  const addMutation = useMutation({
    mutationFn: (data) => db.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
      setText("");
    },
  });

  // Delete a comment (editor or own comment)
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] }),
  });

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser) return;
    setSubmitting(true);
    await addMutation.mutateAsync({
      target_type: targetType,
      target_id: targetId,
      author_id: currentUser.id,
      author_name: currentUser.profile?.display_name || "Anonymous",
      author_avatar: currentUser.profile?.avatar || "logo",
      author_avatar_url: currentUser.profile?.avatar_url || "",
      content: trimmed,
    });
    setSubmitting(false);
  };

  const canDelete = (comment) =>
    isEditor || (currentUser && comment.author_id === currentUser.id);

  return (
    <div className="mt-6 border-t border-border pt-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {/* Comment input box — only shown when logged in */}
      {currentUser && (
        <div className="flex gap-3 mb-5">
          <CommentAvatar avatar={currentUser.profile?.avatar} avatarUrl={currentUser.profile?.avatar_url} />
          <div className="flex-1 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="bg-secondary border-0 text-sm resize-none"
              maxLength={500}
              onKeyDown={(e) => {
                // Submit on Ctrl/Cmd + Enter
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length}/500</span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="h-7 px-3 text-xs gap-1"
              >
                <Send className="w-3 h-3" />
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex gap-3 group"
              >
                <CommentAvatar avatar={comment.author_avatar} avatarUrl={comment.author_avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">{formatCommentDate(comment.created_date)}</span>
                    {/* Delete button — visible to editors always, to author on hover */}
                    {canDelete(comment) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}