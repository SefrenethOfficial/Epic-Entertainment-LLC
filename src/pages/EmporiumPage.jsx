const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];
const DOC_EMBED_URL = "https://docs.google.com/document/d/1fVeCuBYO3nxHrubXJrDROsm0p4VKxYDOt7pq3ENH3S8/preview";

export default function EmporiumPage() {
  const [isEditor, setIsEditor] = useState(false);
  const [info, setInfo] = useState("");
  const [settingsId, setSettingsId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visitorNum] = useState(() => Math.floor(Math.random() * 90000) + 10000);

  useEffect(() => {
    (async () => {
      try {
        const user = await db.auth.me();
        setIsEditor(EDITOR_EMAILS.includes(user.email) || user.role === "admin");
        const settings = await db.entities.SiteSettings.list();
        if (settings.length > 0) {
          setSettingsId(settings[0].id);
          setInfo(settings[0].emporium_info || "Welcome 2 Sefreneths Emporium!!! The most EPIC store in all the land!!! Browse our wares and prepare 2 be AMAZED!!! 🛒✨");
        } else {
          setInfo("Welcome 2 Sefreneths Emporium!!! The most EPIC store in all the land!!! Browse our wares and prepare 2 be AMAZED!!! 🛒✨");
        }
      } catch (e) {/* ignore */}
      setLoading(false);
    })();
  }, []);

  const openEditor = () => {
    setDraft(info);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await db.entities.SiteSettings.update(settingsId, { emporium_info: draft });
      } else {
        const created = await db.entities.SiteSettings.create({ emporium_info: draft });
        setSettingsId(created.id);
      }
      setInfo(draft);
      setEditing(false);
    } catch (e) {/* ignore */}
    setSaving(false);
  };

  return (
    <div
      style={{
        fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
        minHeight: "100vh",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden"
      }}>
      
      {/* Tiled starry background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "#000033",
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, #ffff00, transparent),
            radial-gradient(2px 2px at 60px 70px, #00ffff, transparent),
            radial-gradient(1px 1px at 90px 40px, #ff00ff, transparent),
            radial-gradient(2px 2px at 130px 80px, #ffff00, transparent),
            radial-gradient(1px 1px at 160px 120px, #00ff00, transparent),
            radial-gradient(2px 2px at 200px 50px, #ff00ff, transparent),
            radial-gradient(1px 1px at 240px 100px, #00ffff, transparent)
          `,
          backgroundSize: "280px 140px"
        }} />
      

      {/* Back link */}
      <Link
        to="/"
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          background: "#00ff00",
          color: "#ff00ff",
          padding: "4px 12px",
          border: "3px outset #00cc00",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 100
        }}>
        
        ← BACK 2 HOME
      </Link>

      {/* Spamton sponsor — top right corner */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          zIndex: 100,
          maxWidth: "180px"
        }}>
        
        <div
          style={{
            background: "#000000",
            border: "4px ridge #ffff00",
            padding: "8px",
            textAlign: "center",
            animation: "spamtonblink 0.5s steps(2) infinite"
          }}>
          
          <div style={{ fontSize: "10px", color: "#ff00ff", fontWeight: "bold" }}>SPONSORED</div>
          

          
          <div style={{ fontSize: "12px", color: "#00ffff", fontWeight: "bold" }}>
            FREE KROMER SHOP
          </div>
          <div style={{ fontSize: "20px", marginTop: "4px" }}>💰💰💰</div>
          <div style={{ fontSize: "9px", color: "#ff0000", fontWeight: "bold", marginTop: "4px" }}>
            GET YOUR [[KROMER]] NOW!!!
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "70px 20px 40px", textAlign: "center" }}>
        {/* Fire title */}
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#ff6600",
            textShadow: "0 0 10px #ff0, 0 0 20px #f80, 0 0 30px #f40, 0 0 40px #f00, 2px 2px 4px #000",
            animation: "fireflicker 0.3s ease-in-out infinite alternate",
            marginBottom: "5px",
            lineHeight: 1.2
          }}>
          
          Sefreneths Emporium
        </h1>
        <div style={{ fontSize: "20px", marginBottom: "20px", animation: "fireflicker 0.4s ease-in-out infinite alternate" }}>
          🔥🔥🔥
        </div>

        {/* Marquee */}
        <div
          style={{
            background: "#000080",
            color: "#00ff00",
            padding: "6px 0",
            overflow: "hidden",
            border: "3px ridge #00ff00",
            marginBottom: "25px"
          }}>
          
          <div
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "empmarquee 18s linear infinite",
              fontSize: "16px",
              fontWeight: "bold"
            }}>
            
            ✨ WELCOME 2 THE EMPORIUM ✨ BEST DEALS IN ALL THE LAND ✨ SEFRENETH GUARANTEES QUALITY ✨ BUY NOW PAY NEVER ✨ WELCOME 2 THE EMPORIUM ✨ BEST DEALS IN ALL THE LAND ✨ SEFRENETH GUARANTEES QUALITY ✨ BUY NOW PAY NEVER ✨
          </div>
        </div>

        {/* Under construction */}
        <div
          style={{
            display: "inline-block",
            background: "#ffff00",
            color: "#000080",
            padding: "4px 16px",
            border: "3px ridge #ff0000",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "25px",
            transform: "rotate(-2deg)"
          }}>
          
          🚧 UNDER CONSTRUCTION 🚧
        </div>

        {/* Editable info section */}
        <div
          style={{
            background: "#2a0a2a",
            color: "#ffffff",
            padding: "20px",
            border: "5px ridge #ff00ff",
            marginBottom: "30px",
            fontSize: "16px",
            lineHeight: "1.8",
            textAlign: "left",
            position: "relative"
          }}>
          
          <h2 style={{ textAlign: "center", color: "#ffff00", fontSize: "22px", marginBottom: "12px" }}>
            📜 SEFRENETH'S PROCLAMATION 📜
          </h2>
          {!loading &&
          <p style={{ whiteSpace: "pre-wrap" }}>{info}</p>
          }
          {isEditor && !editing &&
          <div style={{ textAlign: "center", marginTop: "15px" }}>
              <Button
              onClick={openEditor}
              style={{
                background: "#ff00ff",
                color: "#ffffff",
                border: "3px outset #cc00cc",
                fontFamily: "'Comic Sans MS', cursive",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
              
                ✏️ EDIT THIS TEXT
              </Button>
            </div>
          }
        </div>

        {/* Google Doc iframe — My Epic Book */}
        <div
          style={{
            background: "#000080",
            border: "5px ridge #00ffff",
            padding: "10px",
            marginBottom: "30px"
          }}>
          
          <h2
            style={{
              color: "#ffff00",
              fontSize: "22px",
              marginBottom: "10px",
              textAlign: "center",
              textShadow: "2px 2px 0 #ff00ff"
            }}>
            
            📖 My Epic Book! 📖
          </h2>
          <iframe
            src={DOC_EMBED_URL}
            title="My Epic Book!"
            style={{
              width: "100%",
              height: "500px",
              border: "3px inset #00ff00",
              background: "#ffffff"
            }}
            allowFullScreen />
          
        </div>

        {/* Visitor counter */}
        <div
          style={{
            display: "inline-block",
            background: "#000000",
            color: "#00ff00",
            fontFamily: "monospace",
            fontSize: "18px",
            padding: "6px 16px",
            border: "3px inset #00ff00",
            marginBottom: "20px"
          }}>
          
          YOU R VISITOR # {visitorNum.toString().padStart(6, "0")}
        </div>

        <p style={{ color: "#ff00ff", fontSize: "12px", marginTop: "20px" }}>
          © 1997 Sefreneths Emporium. All rites reserved. Best viewed in Netscape Navigator 3.0
        </p>
      </div>

      {/* Edit modal */}
      {editing &&
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}
        onClick={() => setEditing(false)}>
        
          <div
          style={{
            background: "#2a0a2a",
            border: "5px ridge #ff00ff",
            padding: "20px",
            maxWidth: "500px",
            width: "100%"
          }}
          onClick={(e) => e.stopPropagation()}>
          
            <h3 style={{ color: "#ffff00", fontSize: "20px", marginBottom: "12px", textAlign: "center" }}>
              ✏️ EDIT EMPORIUM INFO ✏️
            </h3>
            <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter emporium info..."
            rows={6}
            style={{
              background: "#000033",
              color: "#ffffff",
              border: "3px ridge #00ffff",
              fontFamily: "'Comic Sans MS', cursive",
              resize: "none"
            }} />
          
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
              <Button
              onClick={() => setEditing(false)}
              style={{
                background: "#666666",
                color: "#ffffff",
                border: "3px outset #444444",
                fontFamily: "'Comic Sans MS', cursive",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
              
                CANCEL
              </Button>
              <Button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "#00ff00",
                color: "#000033",
                border: "3px outset #00cc00",
                fontFamily: "'Comic Sans MS', cursive",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
              
                {saving ? "SAVING..." : "SAVE"}
              </Button>
            </div>
          </div>
        </div>
      }

      <style>{`
        @keyframes fireflicker {
          0% { text-shadow: 0 0 10px #ff0, 0 0 20px #f80, 0 0 30px #f40, 0 0 40px #f00, 2px 2px 4px #000; }
          100% { text-shadow: 0 0 15px #ff0, 0 0 25px #f80, 0 0 35px #f40, 0 0 50px #f00, 2px 2px 6px #000; }
        }
        @keyframes empmarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes spamtonblink { 50% { border-color: #00ffff; } }
      `}</style>
    </div>);

}