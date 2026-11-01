const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, Repeat, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];
const MAX_ASKING_PRICE = 600000;

const RARITY_STYLES = {
  common: { border: "border-gray-500", text: "text-gray-400" },
  uncommon: { border: "border-green-500", text: "text-green-400" },
  rare: { border: "border-blue-500", text: "text-blue-400" },
  epic: { border: "border-purple-500", text: "text-purple-400" },
  legendary: { border: "border-yellow-500", text: "text-yellow-400" },
};

function AvatarDisplay({ avatar, avatarUrl }) {
  if ((avatar === "custom" || (avatar && avatar.startsWith("custom_db_"))) && avatarUrl)
    return <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />;
  return <img src={LOGO_URL} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />;
}

export default function TradingPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listingItem, setListingItem] = useState(null);
  const [askingPrice, setAskingPrice] = useState(0);
  const [confirmBuy, setConfirmBuy] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteTrade, setDeleteTrade] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("user");
  const queryClient = useQueryClient();
  const isEditor = EDITOR_EMAILS.includes(userEmail) || userRole === "admin";

  useEffect(() => {
    (async () => {
      try {
        const user = await db.auth.me();
        setUserEmail(user.email || "");
        setUserRole(user.role || "user");
        const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setProfile(profiles[0]);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const { data: myItems = [] } = useQuery({
    queryKey: ["inventory", profile?.user_id],
    queryFn: () => db.entities.InventoryItem.filter({ user_id: profile.user_id }, "-created_date"),
    enabled: !!profile,
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => db.entities.Trade.filter({ status: "open" }, "-created_date"),
  });

  const listMutation = useMutation({
    mutationFn: async ({ item, price }) => {
      const numPrice = Number(price) || 0;
      if (numPrice < 0) throw new Error("Price cannot be negative!");
      if (numPrice > MAX_ASKING_PRICE) throw new Error(`Price cannot exceed ⭐${MAX_ASKING_PRICE.toLocaleString()}!`);
      await db.entities.Trade.create({
        offering_user_id: profile.user_id,
        offering_user_name: profile.display_name || "Unknown",
        offering_user_avatar: profile.avatar || "logo",
        offering_user_avatar_url: profile.avatar_url || "",
        inventory_item_id: item.id,
        item_name: item.item_name,
        item_icon_url: item.item_icon_url || "",
        item_rarity: item.item_rarity || "common",
        item_worth: item.item_worth || 0,
        asking_price: Number(price) || 0,
        status: "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", profile?.user_id] });
      setListingItem(null);
      setAskingPrice(0);
      setToast({ text: "Item listed for trade!", color: "text-green-400" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const buyMutation = useMutation({
    mutationFn: async ({ trade }) => {
      if ((profile.points || 0) < (trade.asking_price || 0)) {
        throw new Error("Not enough points!");
      }
      // Transfer the inventory item to the buyer
      await db.entities.InventoryItem.update(trade.inventory_item_id, {
        user_id: profile.user_id,
        user_email: profile.user_email || "",
        display_name: profile.display_name || "",
      });
      // Deduct points from buyer, add to seller
      const sellerProfiles = await db.entities.UserProfile.filter({ user_id: trade.offering_user_id });
      if (sellerProfiles.length > 0) {
        await db.entities.UserProfile.update(sellerProfiles[0].id, {
          points: (sellerProfiles[0].points || 0) + (trade.asking_price || 0),
        });
      }
      await db.entities.UserProfile.update(profile.id, {
        points: (profile.points || 0) - (trade.asking_price || 0),
      });
      await db.entities.Trade.update(trade.id, {
        status: "completed",
        buyer_user_id: profile.user_id,
        buyer_user_name: profile.display_name || "Unknown",
      });
    },
    onSuccess: async () => {
      const user = await db.auth.me();
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setProfile(profiles[0]);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", profile?.user_id] });
      setConfirmBuy(null);
      setToast({ text: "Trade completed! Item added to your inventory.", color: "text-green-400" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ text: err.message || "Trade failed.", color: "text-red-400" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Trade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      setDeleteTrade(null);
      setToast({ text: "Trade listing deleted.", color: "text-green-400" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-xl font-bold">Trading Post</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
            <span className="text-yellow-400 font-bold text-sm">⭐ {(profile?.points || 0).toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {toast && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-card border border-border shadow-2xl font-semibold text-sm ${toast.color}`}>
            {toast.text}
          </div>
        )}

        {/* Open trades */}
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold mb-4">🏪 Open Trades</h2>
          {tradesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-border bg-card">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground">No open trades yet. List an item below!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trades.map((trade) => {
                const style = RARITY_STYLES[trade.item_rarity] || RARITY_STYLES.common;
                const isOwn = trade.offering_user_id === profile?.user_id;
                return (
                  <div key={trade.id} className={`rounded-xl border-2 ${style.border} bg-card p-4 flex flex-col`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AvatarDisplay avatar={trade.offering_user_avatar} avatarUrl={trade.offering_user_avatar_url} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{trade.offering_user_name}</p>
                        <p className="text-xs text-muted-foreground">Seller</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {trade.item_icon_url ? (
                        <img src={trade.item_icon_url} alt={trade.item_name} className="w-14 h-14 object-cover rounded-lg" />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center text-2xl">📦</div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{trade.item_name}</p>
                        <p className={`text-xs font-bold uppercase ${style.text}`}>{trade.item_rarity}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-bold text-yellow-400 text-sm">⭐ {(trade.asking_price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isEditor && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTrade(trade)}
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {isOwn ? (
                          <span className="text-xs text-muted-foreground px-3 py-2">Your listing</span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={buyMutation.isPending}
                            onClick={() => setConfirmBuy(trade)}
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My items to list */}
        <div>
          <h2 className="font-heading text-lg font-bold mb-4">📤 List an Item</h2>
          {myItems.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-border bg-card">
              <div className="text-4xl mb-3">🎒</div>
              <p className="text-muted-foreground mb-3">You have no items to trade.</p>
              <Link to="/" className="text-primary text-sm hover:underline">Get items from the mystery box →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {myItems.map((item) => {
                const style = RARITY_STYLES[item.item_rarity] || RARITY_STYLES.common;
                return (
                  <div key={item.id} className={`rounded-xl border-2 ${style.border} bg-secondary/30 p-4 flex flex-col items-center`}>
                    {item.item_icon_url ? (
                      <img src={item.item_icon_url} alt={item.item_name} className="w-14 h-14 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center text-2xl mb-2">📦</div>
                    )}
                    <p className="font-semibold text-sm text-center">{item.item_name}</p>
                    <p className={`text-xs font-bold uppercase mt-1 ${style.text}`}>{item.item_rarity}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full gap-1"
                      onClick={() => { setListingItem(item); setAskingPrice(item.item_worth || 0); }}
                    >
                      <Repeat className="w-3 h-3" /> List for Trade
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* List item dialog */}
      <Dialog open={!!listingItem} onOpenChange={(v) => !v && setListingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>List Item for Trade</DialogTitle>
          </DialogHeader>
          {listingItem && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              {listingItem.item_icon_url ? (
                <img src={listingItem.item_icon_url} alt={listingItem.item_name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center text-xl">📦</div>
              )}
              <div>
                <p className="font-semibold text-sm">{listingItem.item_name}</p>
                <p className="text-xs text-muted-foreground">{listingItem.item_rarity} • {listingItem.item_worth || 0} pts worth</p>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs">Asking Price (points)</Label>
            <Input
              type="number"
              min="0"
              max={MAX_ASKING_PRICE}
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="bg-background mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">You have ⭐ {(profile?.points || 0).toLocaleString()} points</p>
            <p className="text-xs text-muted-foreground">Max: ⭐ {MAX_ASKING_PRICE.toLocaleString()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListingItem(null)}>Cancel</Button>
            <Button
              disabled={listMutation.isPending || (() => {
                const p = Number(askingPrice) || 0;
                return p < 0 || p > MAX_ASKING_PRICE;
              })()}
              onClick={() => listMutation.mutate({ item: listingItem, price: askingPrice })}
            >
              {listMutation.isPending ? "Listing..." : "List Trade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTrade} onOpenChange={() => setDeleteTrade(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trade listing?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTrade?.item_name}" listed by {deleteTrade?.offering_user_name} will be removed. The item stays in the seller's inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTrade.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Buy confirmation dialog */}
      <Dialog open={!!confirmBuy} onOpenChange={(v) => !v && setConfirmBuy(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          {confirmBuy && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                {confirmBuy.item_icon_url ? (
                  <img src={confirmBuy.item_icon_url} alt={confirmBuy.item_name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center text-xl">📦</div>
                )}
                <div>
                  <p className="font-semibold text-sm">{confirmBuy.item_name}</p>
                  <p className="text-xs text-muted-foreground">Sold by {confirmBuy.offering_user_name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-bold text-yellow-400">⭐ {(confirmBuy.asking_price || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Your balance after</span>
                <span className="font-bold text-sm">⭐ {((profile?.points || 0) - (confirmBuy.asking_price || 0)).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBuy(null)}>Cancel</Button>
            <Button
              disabled={buyMutation.isPending || (profile?.points || 0) < (confirmBuy?.asking_price || 0)}
              onClick={() => buyMutation.mutate({ trade: confirmBuy })}
            >
              {buyMutation.isPending ? "Processing..." : "Confirm Buy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}