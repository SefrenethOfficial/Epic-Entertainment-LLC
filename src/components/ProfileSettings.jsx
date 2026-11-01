const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Image, Palette, Layers } from "lucide-react";

const PRESET_GRADIENTS = [
  { label: "Dark Default", value: "none", css: "hsl(225,25%,6%)" },
  { label: "Midnight Blue", value: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", css: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  { label: "Deep Purple", value: "linear-gradient(135deg,#1a0533,#3b0764,#1a0533)", css: "linear-gradient(135deg,#1a0533,#3b0764,#1a0533)" },
  { label: "Cyber Green", value: "linear-gradient(135deg,#0a0a0a,#0d2818,#0a0a0a)", css: "linear-gradient(135deg,#0a0a0a,#0d2818,#0a0a0a)" },
  { label: "Crimson Night", value: "linear-gradient(135deg,#1a0000,#3d0000,#1a0000)", css: "linear-gradient(135deg,#1a0000,#3d0000,#1a0000)" },
  { label: "Ocean Depth", value: "linear-gradient(135deg,#001520,#002a4a,#001520)", css: "linear-gradient(135deg,#001520,#002a4a,#001520)" },
  { label: "Sunset Fire", value: "linear-gradient(135deg,#1a0000,#6b1c00,#1a0a00)", css: "linear-gradient(135deg,#1a0000,#6b1c00,#1a0a00)" },
  { label: "Aurora", value: "linear-gradient(135deg,#001a12,#003d2e,#001218)", css: "linear-gradient(135deg,#001a12,#003d2e,#001218)" },
  { label: "Nebula", value: "linear-gradient(135deg,#0d0221,#1a0845,#0d1a2e)", css: "linear-gradient(135deg,#0d0221,#1a0845,#0d1a2e)" },
];

const TABS = [
  { id: "presets", label: "Presets", icon: Layers },
  { id: "gradient", label: "Gradient", icon: Palette },
  { id: "image", label: "Image", icon: Image },
];

export default function ProfileSettings({ open, onClose, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("presets");
  const [selectedPreset, setSelectedPreset] = useState("none");
  const [imageUrl, setImageUrl] = useState("");
  const [gradientFrom, setGradientFrom] = useState("#0f0c29");
  const [gradientTo, setGradientTo] = useState("#302b63");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const user = await db.auth.me();
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        // Restore state from saved background_type/value
        const btype = p.background_type || "none";
        const bval = p.background_value || "";
        if (btype === "preset") {
          setActiveTab("presets");
          setSelectedPreset(bval || "none");
        } else if (btype === "image") {
          setActiveTab("image");
          setImageUrl(bval);
        } else if (btype === "gradient") {
          setActiveTab("gradient");
          // parse gradient from value if possible
        } else {
          setActiveTab("presets");
          setSelectedPreset("none");
        }
      } else {
        setProfile({ user_id: user.id });
        setSelectedPreset("none");
        setImageUrl("");
      }
    }
    load();
  }, [open]);

  const getPreviewStyle = () => {
    if (activeTab === "presets") {
      if (selectedPreset === "none") return {};
      return { background: selectedPreset };
    }
    if (activeTab === "gradient") {
      return { background: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})` };
    }
    if (activeTab === "image" && imageUrl) {
      return { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    return {};
  };

  const getBgTypeAndValue = () => {
    if (activeTab === "presets") {
      if (selectedPreset === "none") return { background_type: "none", background_value: "" };
      return { background_type: "preset", background_value: selectedPreset };
    }
    if (activeTab === "gradient") {
      const val = `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`;
      return { background_type: "gradient", background_value: val };
    }
    if (activeTab === "image") {
      return { background_type: "image", background_value: imageUrl };
    }
    return { background_type: "none", background_value: "" };
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { background_type, background_value } = getBgTypeAndValue();
    const data = { background_type, background_value };
    let saved;
    if (profile?.id) {
      saved = await db.entities.UserProfile.update(profile.id, data);
    } else {
      const user = await db.auth.me();
      saved = await db.entities.UserProfile.create({ ...data, user_id: user.id });
      setProfile(saved);
    }
    setSaving(false);
    // Pass resolved CSS to parent
    onProfileUpdate(getBgCssForParent(background_type, background_value));
    onClose();
  };

  const getBgCssForParent = (type, value) => {
    if (type === "image") return { background_url: value, background_color: "" };
    if (type === "none") return { background_url: "", background_color: "" };
    return { background_url: "", background_color: value };
  };

  const previewStyle = getPreviewStyle();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 m-auto z-50 w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold">Background Settings</h2>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>

            {/* Live preview */}
            <div
              className="w-full h-24 rounded-xl border border-border mb-5 relative overflow-hidden transition-all duration-500"
              style={previewStyle}
            >
              {!Object.keys(previewStyle).length && (
                <div className="absolute inset-0 bg-background flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Default dark background</span>
                </div>
              )}
              {activeTab === "image" && imageUrl && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Image preview</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "presets" && (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_GRADIENTS.map((bg) => (
                  <button
                    key={bg.label}
                    onClick={() => setSelectedPreset(bg.value)}
                    className={`h-16 rounded-lg border-2 text-xs font-medium transition-all relative overflow-hidden ${
                      selectedPreset === bg.value
                        ? "border-primary shadow-lg shadow-primary/30 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    style={{ background: bg.css }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-white/80 drop-shadow text-xs px-1 text-center leading-tight">
                      {bg.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "gradient" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5 block">From Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={gradientFrom}
                        onChange={(e) => setGradientFrom(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                      />
                      <Input value={gradientFrom} onChange={(e) => setGradientFrom(e.target.value)} className="bg-secondary border-0 font-mono text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5 block">To Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={gradientTo}
                        onChange={(e) => setGradientTo(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                      />
                      <Input value={gradientTo} onChange={(e) => setGradientTo(e.target.value)} className="bg-secondary border-0 font-mono text-sm" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Angle: {gradientAngle}°</Label>
                  <input
                    type="range" min={0} max={360} value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            {activeTab === "image" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Image URL</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="text-center text-muted-foreground text-xs">or</div>
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground">
                    {uploading
                      ? <span className="w-4 h-4 border-2 border-t-primary rounded-full animate-spin" />
                      : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : "Upload Image"}
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Apply Background"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}