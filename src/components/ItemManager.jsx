const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Trash2, Plus } from "lucide-react";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

const RARITY_TEXT = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

export default function ItemManager({ open, onOpenChange }) {
  const [itemName, setItemName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [rarity, setRarity] = useState("common");
  const [worth, setWorth] = useState(0);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Item.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setItemName("");
      setIconUrl("");
      setRarity("common");
      setWorth(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Item.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const handleCreate = () => {
    if (!itemName || !iconUrl) return;
    createMutation.mutate({
      item_name: itemName,
      icon_url: iconUrl,
      rarity,
      worth: Number(worth) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🗡️ Item Manager</DialogTitle>
        </DialogHeader>

        {/* Create form */}
        <div className="space-y-3 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Item Name</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Sword of Epic" className="bg-background mt-1" />
            </div>
            <div>
              <Label className="text-xs">Icon Image URL</Label>
              <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://..." className="bg-background mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger className="bg-background mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Worth (points)</Label>
              <Input type="number" value={worth} onChange={(e) => setWorth(e.target.value)} placeholder="100" className="bg-background mt-1" />
            </div>
          </div>
          {iconUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <img src={iconUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}
          <Button onClick={handleCreate} disabled={!itemName || !iconUrl || createMutation.isPending} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Create Item
          </Button>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{items.length} items</p>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No items yet. Create one above!</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border">
                {item.icon_url ? (
                  <img src={item.icon_url} alt={item.item_name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center text-xl">📦</div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.item_name}</p>
                  <p className={`text-xs font-bold uppercase ${RARITY_TEXT[item.rarity] || "text-muted-foreground"}`}>
                    {item.rarity} • {item.worth || 0} pts
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}