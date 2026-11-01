const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Pin, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CommentsSection from "@/components/CommentsSection";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

const CATEGORY_COLORS = {
  announcement: "bg-primary/20 text-primary border-primary/30",
  update: "bg-accent/20 text-accent border-accent/30",
  event: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  other: "bg-secondary text-muted-foreground border-border",
};

const CATEGORY_ICONS = {
  announcement: "📢",
  update: "🔄",
  event: "🎉",
  other: "📌",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function NewsFormDialog({ open, onOpenChange, post, onSave }) {
  const [form, setForm] = useState({ title: "", content: "", image_url: "", category: "announcement", pinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) setForm({ title: post.title || "", content: post.content || "", image_url: post.image_url || "", category: post.category || "announcement", pinned: post.pinned || false });
    else setForm({ title: "", content: "", image_url: "", category: "announcement", pinned: false });
  }, [post, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{post ? "Edit Post" : "New Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="mb-1.5 block text-sm">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post headline..." required className="bg-secondary border-0" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Content</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your post..." required className="bg-secondary border-0 min-h-[120px]" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Image URL (optional)</Label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="bg-secondary border-0" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">📢 Announcement</SelectItem>
                  <SelectItem value="update">🔄 Update</SelectItem>
                  <SelectItem value="event">🎉 Event</SelectItem>
                  <SelectItem value="other">📌 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-primary w-4 h-4" />
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Pin className="w-3.5 h-3.5" /> Pin</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : post ? "Save Changes" : "Publish"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewsCard({ post, isEditor, onEdit, onDelete }) {
  return (
    <article className={`bg-card rounded-xl border overflow-hidden ${post.pinned ? "border-primary/50" : "border-border"}`}>
      {post.image_url && (
        <div className="h-48 overflow-hidden">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.other}`}>
              {CATEGORY_ICONS[post.category]} {post.category}
            </span>
            {post.pinned && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 font-medium flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>
          {isEditor && (
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(post)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(post)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <h2 className="font-heading font-bold text-lg text-foreground mb-2">{post.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-muted-foreground mt-3">{formatDate(post.created_date)}</p>
        {/* Comments thread for this news post */}
        <CommentsSection targetType="news" targetId={post.id} />
      </div>
    </article>
  );
}

export default function NewsPage() {
  const [isEditor, setIsEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then((u) => {
      setIsEditor(EDITOR_EMAILS.includes(u.email) || u.role === "admin");
    });
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => db.entities.NewsPost.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.NewsPost.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news"] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.NewsPost.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news"] }); setShowForm(false); setEditingPost(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.NewsPost.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["news"] }); setDeletePost(null); },
  });

  const handleSave = async (formData) => {
    if (editingPost) await updateMutation.mutateAsync({ id: editingPost.id, data: formData });
    else await createMutation.mutateAsync(formData);
  };

  // Pinned first, then newest
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-xl font-bold">News</h1>
            </div>
          </div>
          {isEditor && (
            <Button size="sm" className="gap-1.5" onClick={() => { setEditingPost(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> New Post
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">📰</div>
            <h3 className="font-heading text-2xl font-bold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Check back soon for announcements and updates.</p>
            {isEditor && <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Write First Post</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {sortedPosts.map((post) => (
              <NewsCard
                key={post.id}
                post={post}
                isEditor={isEditor}
                onEdit={(p) => { setEditingPost(p); setShowForm(true); }}
                onDelete={setDeletePost}
              />
            ))}
          </div>
        )}
      </main>

      <NewsFormDialog
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditingPost(null); }}
        post={editingPost}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletePost?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletePost.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}