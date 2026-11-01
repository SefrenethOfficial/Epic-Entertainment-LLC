const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Check, Pencil, Plus, Trash2, Save, X, Gem, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];
const DEFAULT_QUOTES = ["Welcome, traveler!", "Browse my wares!", "Excellent taste!", "Points well spent!", "Diamonds are precious!"];
const DEFAULT_FACE = "🧙";

export default function ShopPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [shopSettingsId, setShopSettingsId] = useState(null);
  const [currentQuote, setCurrentQuote] = useState("");
  const [purchasing, setPurchasing] = useState(null);
  const [purchaseMsg, setPurchaseMsg] = useState(null);
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState({ shopkeeper_face: "", quotes: [] });
  const [newQuote, setNewQuote] = useState("");
  const [savingShop, setSavingShop] = useState(false);
  const [converting, setConverting] = useState(false);
  const quoteInterval = useRef(null);
  const queryClient = useQueryClient();

  const isEditor = EDITOR_EMAILS.includes(currentUser?.email) || currentUser?.role === "admin";

  const { data: shopAvatars = [], isLoading: shopLoading } = useQuery({
    queryKey: ["shop-avatars"],
    queryFn: () => db.entities.CustomAvatar.filter({ in_shop: true }),
  });

  const { data: diamondAvatars = [], isLoading: diamondLoading } = useQuery({
    queryKey: ["diamond-shop-avatars"],
    queryFn: () => db.entities.CustomAvatar.filter({ in_diamond_shop: true }),
  });

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      setCurrentUser(user);
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setUserProfile(profiles[0]);
      const settings = await db.entities.ShopSettings.list();
      if (settings.length > 0) {
        setShopSettings(settings[0]);
        setShopSettingsId(settings[0].id);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const quotes = shopSettings?.quotes?.length ? shopSettings.quotes : DEFAULT_QUOTES;
    const pick = () => setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    pick();
    quoteInterval.current = setInterval(pick, 4000);
    return () => clearInterval(quoteInterval.current);
  }, [shopSettings]);

  const face = shopSettings?.shopkeeper_face || DEFAULT_FACE;
  const ownedAvatarIds = userProfile?.owned_avatar_ids || [];

  const showMsg = (type, text) => {
    setPurchaseMsg({ type, text });
    setTimeout(() => setPurchaseMsg(null), 3000);
  };

  const handleBuyPoints = async (av) => {
    if (!userProfile) return;
    if ((userProfile.points || 0) < av.price) { showMsg("error", "Not enough points!"); return; }
    setPurchasing(av.id);
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      points: (userProfile.points || 0) - av.price,
      owned_avatar_ids: [...ownedAvatarIds, av.id],
    });
    setUserProfile(updated);
    setPurchasing(null);
    showMsg("success", `Bought "${av.label}"! 🎉`);
  };

  const handleBuyDiamonds = async (av) => {
    if (!userProfile) return;
    if ((userProfile.diamonds || 0) < (av.diamond_price || 1)) { showMsg("error", "Not enough diamonds! 💎"); return; }
    setPurchasing(av.id);
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      diamonds: (userProfile.diamonds || 0) - (av.diamond_price || 1),
      owned_avatar_ids: [...ownedAvatarIds, av.id],
    });
    setUserProfile(updated);
    setPurchasing(null);
    showMsg("success", `Bought "${av.label}"! 💎`);
  };

  const handleConvertDiamond = async () => {
    if (!userProfile || (userProfile.diamonds || 0) < 1) { showMsg("error", "You need at least 1 diamond!"); return; }
    setConverting(true);
    const updated = await db.entities.UserProfile.update(userProfile.id, {
      diamonds: (userProfile.diamonds || 0) - 1,
      points: (userProfile.points || 0) + 500,
    });
    setUserProfile(updated);
    setConverting(false);
    showMsg("success", "Converted 1 💎 → 500 ⭐ pts!");
  };

  const handleOpenEditShop = () => {
    setShopForm({
      shopkeeper_face: shopSettings?.shopkeeper_face || DEFAULT_FACE,
      quotes: shopSettings?.quotes?.length ? [...shopSettings.quotes] : [...DEFAULT_QUOTES],
    });
    setEditingShop(true);
  };

  const handleSaveShop = async () => {
    setSavingShop(true);
    const data = { shopkeeper_face: shopForm.shopkeeper_face, quotes: shopForm.quotes.filter(q => q.trim()) };
    if (shopSettingsId) {
      await db.entities.ShopSettings.update(shopSettingsId, data);
    } else {
      const created = await db.entities.ShopSettings.create(data);
      setShopSettingsId(created.id);
    }
    setShopSettings(data);
    setSavingShop(false);
    setEditingShop(false);
  };

  const AvatarCard = ({ av, owned, onBuy, currencyLabel, canAfford }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${owned ? "border-accent/50 bg-accent/5" : "border-border bg-card"}`}
    >
      <img src={av.url} alt={av.label} className="w-20 h-20 rounded-2xl object-cover shadow" />
      <p className="font-semibold text-foreground text-sm text-center leading-tight">{av.label}</p>
      {owned ? (
        <span className="flex items-center gap-1 text-xs text-accent font-bold"><Check className="w-3.5 h-3.5" /> Owned</span>
      ) : (
        <Button size="sm" onClick={onBuy} disabled={!!purchasing || !canAfford}
          className={`w-full h-8 text-xs gap-1 ${!canAfford ? "opacity-50" : ""}`}>
          {purchasing === av.id ? "Buying..." : currencyLabel}
        </Button>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-bold">Shop</h1>
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <>
                <span className="text-sm font-bold text-primary">⭐ {(userProfile.points || 0).toLocaleString()}</span>
                <span className="text-sm font-bold text-cyan-400">💎 {userProfile.diamonds || 0}</span>
              </>
            )}
            {isEditor && (
              <Button size="sm" variant="outline" onClick={handleOpenEditShop} className="h-8 px-2.5 text-xs gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Shopkeeper */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-primary/40 flex items-center justify-center text-5xl shadow-lg overflow-hidden">
              {face.startsWith("http") ? <img src={face} alt="Shopkeeper" className="w-full h-full object-cover" /> : face}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs">✨</div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentQuote} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="bg-card border border-border rounded-2xl px-5 py-3 text-sm text-foreground italic max-w-xs text-center shadow">
              "{currentQuote}"
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Feedback toast */}
        <AnimatePresence>
          {purchaseMsg && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={`text-center py-3 px-4 rounded-xl text-sm font-semibold ${purchaseMsg.type === "success" ? "bg-accent/20 text-accent border border-accent/30" : "bg-destructive/20 text-destructive border border-destructive/30"}`}>
              {purchaseMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs defaultValue="points">
          <TabsList className="bg-secondary w-full">
            <TabsTrigger value="points" className="flex-1 gap-1.5"><Star className="w-3.5 h-3.5" /> Points Shop</TabsTrigger>
            <TabsTrigger value="diamonds" className="flex-1 gap-1.5"><Gem className="w-3.5 h-3.5 text-cyan-400" /> Diamond Shop</TabsTrigger>
          </TabsList>

          {/* POINTS SHOP */}
          <TabsContent value="points" className="mt-6">
            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Avatars — spend ⭐ points</h2>
            {shopLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
            ) : shopAvatars.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><div className="text-4xl mb-3">🏪</div><p>No avatars in the points shop yet.</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {shopAvatars.map((av) => (
                  <AvatarCard key={av.id} av={av} owned={ownedAvatarIds.includes(av.id)}
                    onBuy={() => handleBuyPoints(av)}
                    canAfford={(userProfile?.points || 0) >= av.price}
                    currencyLabel={`⭐ ${(av.price || 0).toLocaleString()} pts`} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* DIAMOND SHOP */}
          <TabsContent value="diamonds" className="mt-6 space-y-6">
            {/* Convert diamonds to points */}
            <div className="flex items-center justify-between bg-card border border-cyan-400/30 rounded-2xl px-5 py-4">
              <div>
                <p className="font-semibold text-foreground text-sm">Convert Diamonds → Points</p>
                <p className="text-xs text-muted-foreground mt-0.5">1 💎 = 500 ⭐ pts &nbsp;·&nbsp; You have <span className="text-cyan-400 font-bold">{userProfile?.diamonds || 0} 💎</span></p>
              </div>
              <Button onClick={handleConvertDiamond} disabled={converting || (userProfile?.diamonds || 0) < 1} size="sm" className="gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white">
                <RefreshCw className="w-3.5 h-3.5" /> {converting ? "..." : "Convert"}
              </Button>
            </div>

            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Avatars — spend 💎 diamonds</h2>
            {diamondLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
            ) : diamondAvatars.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><div className="text-4xl mb-3">💎</div><p>No diamond shop avatars yet.</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {diamondAvatars.map((av) => (
                  <AvatarCard key={av.id} av={av} owned={ownedAvatarIds.includes(av.id)}
                    onBuy={() => handleBuyDiamonds(av)}
                    canAfford={(userProfile?.diamonds || 0) >= (av.diamond_price || 1)}
                    currencyLabel={`💎 ${av.diamond_price || 1}`} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Shop Dialog */}
      <AnimatePresence>
        {editingShop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg">Edit Shopkeeper</h2>
                <button onClick={() => setEditingShop(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Shopkeeper Face (emoji or image URL)</label>
                <Input value={shopForm.shopkeeper_face} onChange={e => setShopForm(f => ({ ...f, shopkeeper_face: e.target.value }))} placeholder="🧙 or https://..." />
                <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-3xl overflow-hidden">
                  {shopForm.shopkeeper_face?.startsWith("http") ? <img src={shopForm.shopkeeper_face} alt="Preview" className="w-full h-full object-cover rounded-full" /> : shopForm.shopkeeper_face || "🧙"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Shopkeeper Quotes</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {shopForm.quotes.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={q} onChange={e => setShopForm(f => { const quotes = [...f.quotes]; quotes[i] = e.target.value; return { ...f, quotes }; })} className="text-sm h-8 flex-1" />
                      <button onClick={() => setShopForm(f => ({ ...f, quotes: f.quotes.filter((_, j) => j !== i) }))} className="text-destructive hover:text-destructive/80 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newQuote} onChange={e => setNewQuote(e.target.value)} placeholder="Add a new quote..." className="text-sm h-8"
                    onKeyDown={e => { if (e.key === "Enter" && newQuote.trim()) { setShopForm(f => ({ ...f, quotes: [...f.quotes, newQuote.trim()] })); setNewQuote(""); } }} />
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { if (newQuote.trim()) { setShopForm(f => ({ ...f, quotes: [...f.quotes, newQuote.trim()] })); setNewQuote(""); } }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveShop} disabled={savingShop} className="flex-1 gap-2"><Save className="w-4 h-4" /> {savingShop ? "Saving..." : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditingShop(false)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}