const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, MessageSquare, Send, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

function AvatarDisplay({ profile }) {
  if ((profile?.avatar === "custom" || profile?.avatar?.startsWith("custom_db_")) && profile?.avatar_url)
    return <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" alt="avatar" />;
  return <img src={LOGO_URL} className="w-9 h-9 rounded-lg object-cover ring-2 ring-primary/30" alt="logo" />;
}

function CommentBox({ threadId, currentUser, userProfile, isEditor, onCommentAdded }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await db.entities.Comment.create({
      target_type: "news",
      target_id: `thread_${threadId}`,
      author_id: currentUser.id,
      author_name: userProfile?.display_name || "User",
      author_avatar: userProfile?.avatar || "logo",
      author_avatar_url: userProfile?.avatar_url || "",
      content: text.trim(),
    });
    setText("");
    setLoading(false);
    onCommentAdded();
  };

  return (
    <div className="flex gap-2 mt-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
        placeholder="Write a comment..."
        className="flex-1 bg-secondary border-0 text-sm h-9"
      />
      <Button onClick={submit} disabled={loading || !text.trim()} size="sm" className="h-9 px-3">
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function ThreadCard({ thread, currentUser, userProfile, isEditor, queryClient }) {
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'thread'|'comment', id, title }
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = async () => {
    setCommentsLoading(true);
    const data = await db.entities.Comment.filter({ target_type: "news", target_id: `thread_${thread.id}` }, "-created_date");
    setComments(data);
    setCommentsLoading(false);
  };

  const handleExpand = () => {
    if (!expanded) loadComments();
    setExpanded((v) => !v);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget.type === "thread") {
      // also delete comments
      const threadComments = await db.entities.Comment.filter({ target_type: "news", target_id: `thread_${thread.id}` });
      await Promise.all(threadComments.map((c) => db.entities.Comment.delete(c.id)));
      await db.entities.Thread.delete(thread.id);
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    } else {
      await db.entities.Comment.delete(deleteTarget.id);
      loadComments();
    }
    setDeleteTarget(null);
  };

  const canDeleteThread = isEditor || thread.author_id === currentUser?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Thread header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AvatarDisplay profile={{ avatar: thread.author_avatar, avatar_url: thread.author_avatar_url }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${thread.author_id}`} className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                {thread.author_name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {new Date(thread.created_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <h3 className="font-heading font-bold text-base mt-1 text-foreground">{thread.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{thread.content}</p>
            {thread.image_url && (
              <img src={thread.image_url} alt="thread" className="mt-3 rounded-xl max-h-64 object-cover w-full" />
            )}
          </div>
          {canDeleteThread && (
            <button
              onClick={() => setDeleteTarget({ type: "thread", id: thread.id, title: thread.title })}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleExpand}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {expanded ? "Hide comments" : "Show comments"}
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pt-3 pb-4 bg-secondary/20">
              {commentsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">No comments yet. Be the first!</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <AvatarDisplay profile={{ avatar: c.author_avatar, avatar_url: c.author_avatar_url }} />
                      <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/profile/${c.author_id}`} className="text-xs font-semibold text-foreground hover:text-primary transition-colors">
                            {c.author_name}
                          </Link>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(c.created_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{c.content}</p>
                      </div>
                      {(isEditor || c.author_id === currentUser?.id) && (
                        <button
                          onClick={() => setDeleteTarget({ type: "comment", id: c.id, title: "this comment" })}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <CommentBox
                threadId={thread.id}
                currentUser={currentUser}
                userProfile={userProfile}
                isEditor={isEditor}
                onCommentAdded={loadComments}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "thread" ? `"${deleteTarget?.title}"` : "this comment"}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function NewThreadDialog({ open, onClose, currentUser, userProfile, onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setTitle(""); setContent(""); }
  }, [open]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    await db.entities.Thread.create({
      author_id: currentUser.id,
      author_name: userProfile?.display_name || "User",
      author_avatar: userProfile?.avatar || "logo",
      author_avatar_url: userProfile?.avatar_url || "",
      title: title.trim(),
      content: content.trim(),
    });
    setLoading(false);
    onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg">New Thread</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thread title..."
            className="bg-secondary border-0"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to say?"
            rows={5}
            className="bg-secondary border-0 resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !title.trim() || !content.trim()}>
            {loading ? "Posting..." : "Post Thread"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ThreadsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      setCurrentUser(user);
      setIsEditor(EDITOR_EMAILS.includes(user.email) || user.role === "admin");
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setUserProfile(profiles[0]);
    }
    load();
  }, []);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => db.entities.Thread.list("-created_date"),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">💬</span>
            <h1 className="font-heading text-xl font-bold">Threads</h1>
          </div>
          {currentUser && (
            <Button onClick={() => setShowNew(true)} className="gap-2" size="sm">
              <Plus className="w-4 h-4" /> New Thread
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-heading text-2xl font-bold mb-2">No threads yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
            <Button onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Thread
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUser={currentUser}
                userProfile={userProfile}
                isEditor={isEditor}
                queryClient={queryClient}
              />
            ))}
          </div>
        )}
      </main>

      <NewThreadDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["threads"] })}
      />
    </div>
  );
}