const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#ffd700;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:2rem;">
    <h1 style="color:#e63946;font-size:3rem;margin-bottom:1rem;">"Better Call Saul!"</h1>
    <p style="font-size:1.4rem;color:#333;font-weight:bold;">Need legal help? Call now!</p>
    <p style="font-size:2.5rem;font-weight:bold;color:#e63946;">(505) 503-4455</p>
    <p style="color:#333;font-style:italic;font-size:1.1rem;">Se Habla Español</p>
  </div>
</body>
</html>`;

export default function PosterPage() {
  const [html, setHtml] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isEditor, setIsEditor] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      setIsEditor(EDITOR_EMAILS.includes(user.email) || user.role === "admin");
      const settings = await db.entities.SiteSettings.list();
      if (settings.length > 0) {
        setSettingsId(settings[0].id);
        setHtml(settings[0].poster_html || DEFAULT_HTML);
      } else {
        setHtml(DEFAULT_HTML);
      }
    }
    load();
  }, []);

  // Write HTML into iframe srcdoc
  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.srcdoc = html;
    }
  }, [html]);

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await db.entities.SiteSettings.update(settingsId, { poster_html: draft });
    } else {
      const created = await db.entities.SiteSettings.create({ poster_html: draft });
      setSettingsId(created.id);
    }
    setHtml(draft);
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <h1 className="font-heading text-xl font-bold flex-1">Poster</h1>
          {isEditor && !editing && (
            <Button onClick={() => { setDraft(html); setEditing(true); }} variant="outline" size="sm" className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit HTML
            </Button>
          )}
          {isEditor && editing && (
            <div className="flex gap-2">
              <Button onClick={() => setEditing(false)} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleSave} size="sm" disabled={saving} className="gap-2">
                <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {editing ? (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-4">
          <p className="text-sm text-muted-foreground">Edit the full HTML displayed on this page.</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={20}
            className="w-full rounded-xl border border-border bg-secondary p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
          />
          <div className="border border-border rounded-xl overflow-hidden">
            <p className="text-xs text-muted-foreground px-4 py-2 font-semibold uppercase tracking-wider border-b border-border bg-secondary/30">Preview</p>
            <iframe
              srcDoc={draft}
              className="w-full h-96 border-0"
              sandbox="allow-scripts"
              title="preview"
            />
          </div>
        </main>
      ) : (
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0"
          style={{ minHeight: "calc(100vh - 65px)" }}
          sandbox="allow-scripts"
          title="poster"
        />
      )}
    </div>
  );
}