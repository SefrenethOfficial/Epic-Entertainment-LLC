const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, ShoppingBag, Upload, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

const BUILT_IN_AVATARS = [
  { id: "logo", label: "Epic Logo", url: LOGO_URL, free: true },
];

export default function AvatarSelectPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("logo");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editor controls
  const [addingAvatar, setAddingAvatar] = useState(false);
  const [newAvatarLabel, setNewAvatarLabel] = useState("");
  const [newAvatarPrice, setNewAvatarPrice] = useState(0);
  const [newAvatarDiamondPrice, setNewAvatarDiamondPrice] = useState(1);
  const [newAvatarInShop, setNewAvatarInShop] = useState(false);
  const [newAvatarInDiamondShop, setNewAvatarInDiamondShop] = useState(false);
  const [newAvatarUploading, setNewAvatarUploading] = useState(false);

  const isEditor = EDITOR_EMAILS.includes(currentUser?.email) || currentUser?.role === "admin";

  const { data: allAvatars = [], refetch: refetchAvatars } = useQuery({
    queryKey: ["all-avatars"],
    queryFn: () => db.entities.CustomAvatar.list("-created_date"),
  });

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      setCurrentUser(user);
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        const p = profiles[0];
        setUserProfile(p);
        setSelectedAvatar(p.avatar || "logo");
        setSelectedAvatarUrl(p.avatar_url || "");
      }
    }
    load();
  }, []);

  const ownedIds = userProfile?.owned_avatar_ids || [];
  const userPoints = userProfile?.points || 0;

  const isUnlocked = (av) => {
    if (av.free) return true;
    if (!av.in_shop) return true; // not in shop = free to use
    return ownedIds.includes(av.id);
  };

  const handleSelect = (avatarId, avatarUrl) => {
    const av = allAvatars.find(a => `custom_db_${a.id}` === avatarId);
    if (av && av.in_shop && !ownedIds.includes(av.id)) return; // locked
    setSelectedAvatar(avatarId);
    setSelectedAvatarUrl(avatarUrl || "");
  };

  const handleSave = async () => {
    if (!userProfile) return;
    setSaving(true);
    await db.entities.UserProfile.update(userProfile.id, {
      avatar: selectedAvatar,
      avatar_url: selectedAvatarUrl || "",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate(-1); }, 800);
  };

  const handleAddAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewAvatarUploading(true);
    const label = newAvatarLabel.trim() || file.name.replace(/\.[^.]+$/, "");
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    await db.entities.CustomAvatar.create({ label, url: file_url, price: Number(newAvatarPrice) || 0, diamond_price: Number(newAvatarDiamondPrice) || 1, in_shop: newAvatarInShop, in_diamond_shop: newAvatarInDiamondShop });
    setNewAvatarLabel("");
    setNewAvatarPrice(0);
    setNewAvatarDiamondPrice(1);
    setNewAvatarInShop(false);
    setNewAvatarInDiamondShop(false);
    setNewAvatarUploading(false);
    setAddingAvatar(false);
    refetchAvatars();
  };

  const handleDeleteAvatar = async (av) => {
    await db.entities.CustomAvatar.delete(av.id);
    if (selectedAvatar === `custom_db_${av.id}`) {
      setSelectedAvatar("logo");
      setSelectedAvatarUrl("");
    }
    refetchAvatars();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="font-heading text-lg font-bold">🎭 Avatar Selection</h1>
          <div className="flex items-center gap-2">
            {userProfile && (
              <span className="text-sm font-bold text-primary">⭐ {userPoints.toLocaleString()} pts</span>
            )}
            <Link to="/shop">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <ShoppingBag className="w-3.5 h-3.5" /> Shop
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Current Avatar Preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-secondary border-4 border-primary/40 overflow-hidden shadow-xl shadow-primary/10 flex items-center justify-center">
              {(selectedAvatar === "custom" || selectedAvatar?.startsWith("custom_db_")) && selectedAvatarUrl ? (
                <img src={selectedAvatarUrl} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-sm">✨</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Your current avatar</p>
        </motion.div>

        {/* Editor: Add Avatar Panel */}
        {isEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Editor Controls</p>
              <button
                onClick={() => setAddingAvatar(v => !v)}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> {addingAvatar ? "Cancel" : "Add Avatar"}
              </button>
            </div>

            <AnimatePresence>
              {addingAvatar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Input
                    value={newAvatarLabel}
                    onChange={(e) => setNewAvatarLabel(e.target.value)}
                    placeholder="Avatar label (optional)..."
                    className="bg-secondary border-0 text-sm h-9"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">⭐ Price (pts)</label>
                      <Input type="number" value={newAvatarPrice} onChange={(e) => setNewAvatarPrice(e.target.value)} className="bg-secondary border-0 text-sm h-9 mt-1" min={0} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">💎 Price (gems)</label>
                      <Input type="number" value={newAvatarDiamondPrice} onChange={(e) => setNewAvatarDiamondPrice(e.target.value)} className="bg-secondary border-0 text-sm h-9 mt-1" min={1} />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="text-xs text-muted-foreground mb-1">⭐ Shop?</label>
                      <button type="button" onClick={() => setNewAvatarInShop(v => !v)}
                        className={`h-9 px-4 rounded-lg text-xs font-semibold border transition-colors ${newAvatarInShop ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                        {newAvatarInShop ? "Yes" : "No"}
                      </button>
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="text-xs text-muted-foreground mb-1">💎 Shop?</label>
                      <button type="button" onClick={() => setNewAvatarInDiamondShop(v => !v)}
                        className={`h-9 px-4 rounded-lg text-xs font-semibold border transition-colors ${newAvatarInDiamondShop ? "bg-cyan-500/20 border-cyan-400 text-cyan-400" : "border-border text-muted-foreground"}`}>
                        {newAvatarInDiamondShop ? "Yes" : "No"}
                      </button>
                    </div>
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-primary/50 text-sm text-muted-foreground bg-secondary/50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddAvatarUpload} />
                    <Upload className="w-4 h-4" />
                    {newAvatarUploading ? "Uploading..." : "Upload image to add to library"}
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Built-in + Custom Avatars */}
        <div>
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Choose Avatar</h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {/* Logo built-in */}
            {BUILT_IN_AVATARS.map((av) => {
              const active = selectedAvatar === av.id;
              return (
                <motion.button
                  key={av.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelect(av.id, "")}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    active ? "border-primary bg-primary/10 shadow-md shadow-primary/20" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <img src={av.url} alt={av.label} className="w-14 h-14 rounded-xl object-cover" />
                  <span className="text-xs text-muted-foreground text-center leading-tight">{av.label}</span>
                  {active && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-[10px] text-accent font-semibold">Free</span>
                </motion.button>
              );
            })}

            {/* DB Avatars */}
            {allAvatars.map((av) => {
              const avatarId = `custom_db_${av.id}`;
              const active = selectedAvatar === avatarId;
              const unlocked = isUnlocked(av);
              const shopLocked = av.in_shop && !ownedIds.includes(av.id);

              return (
                <div key={av.id} className="relative group">
                  <motion.button
                    whileTap={unlocked ? { scale: 0.96 } : {}}
                    onClick={() => unlocked ? handleSelect(avatarId, av.url) : null}
                    className={`relative w-full flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      active ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                      : shopLocked ? "border-border bg-card/50 opacity-60 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="relative w-14 h-14">
                      <img src={av.url} alt={av.label} className={`w-14 h-14 rounded-xl object-cover ${shopLocked ? "grayscale" : ""}`} />
                      {shopLocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground text-center leading-tight max-w-[70px] truncate">{av.label}</span>
                    {shopLocked ? (
                      <span className="text-[10px] text-yellow-400 font-semibold">⭐ {(av.price || 0).toLocaleString()}</span>
                    ) : (
                      <span className="text-[10px] text-accent font-semibold">Owned</span>
                    )}
                    {active && !shopLocked && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>

                  {/* Editor delete */}
                  {isEditor && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(av); }}
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Go to shop if locked */}
                  {shopLocked && (
                    <Link to="/shop" className="absolute inset-0 rounded-2xl" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Note about locked avatars */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Locked avatars can be purchased from the <Link to="/shop" className="text-primary hover:underline">Avatar Shop</Link> using your points.
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full gap-2 h-12">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Avatar</>}
        </Button>
      </main>
    </div>
  );
}