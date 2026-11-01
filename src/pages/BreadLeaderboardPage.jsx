const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router-dom";

const BREAD_BG = "https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/b8f9b14e2_image.png";
const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";

function AvatarDisplay({ avatar, avatarUrl }) {
  if ((avatar === "custom" || (avatar && avatar.startsWith("custom_db_"))) && avatarUrl)
    return <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" style={{ border: "3px ridge #ff00ff" }} />;
  return <img src={LOGO_URL} alt="avatar" className="w-10 h-10 rounded-lg object-cover" style={{ border: "3px ridge #ff00ff" }} />;
}

export default function BreadLeaderboardPage() {
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    db.auth.me().then((u) => setCurrentUserId(u.id || ""));
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: () => db.entities.UserProfile.list("-bread_points", 100),
  });

  const valid = profiles.filter((p) => p.display_name && !p.banned && (p.bread_points || 0) > 0);

  return (
    <div
      style={{
        fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
        backgroundImage: `url(${BREAD_BG})`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px",
        minHeight: "100vh",
        color: "#ffff00",
        position: "relative",
      }}
    >
      {/* Back link */}
      <Link
        to="/bread"
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
          zIndex: 100,
        }}
      >
        ← BACK 2 BREAD
      </Link>
      <Link
        to="/"
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#00ff00",
          color: "#ff00ff",
          padding: "4px 12px",
          border: "3px outset #00cc00",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 100,
        }}
      >
        HOME 🍞
      </Link>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "36px",
            color: "#ff00ff",
            textShadow: "3px 3px 0 #00ffff, -2px -2px 0 #ffff00",
            animation: "breadblink 1s steps(2) infinite",
            marginBottom: "10px",
          }}
        >
          🍞 BREAD LEADERBOARD 🍞
        </h1>

        <div
          style={{
            background: "#000080",
            color: "#00ff00",
            padding: "6px 0",
            overflow: "hidden",
            border: "3px ridge #00ff00",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "breadmarquee 15s linear infinite",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            🍞 TOP BREAD EARNERS 🍞 ALL HAIL THE BREAD GOD 🍞 CLICK CLICK CLICK 🍞 TOP BREAD EARNERS 🍞 ALL HAIL THE BREAD GOD 🍞 CLICK CLICK CLICK 🍞
          </div>
        </div>

        {isLoading ? (
          <div style={{ fontSize: "24px", color: "#00ff00" }}>LOADING BREAD DATA...</div>
        ) : valid.length === 0 ? (
          <div
            style={{
              background: "#800080",
              color: "#ffffff",
              padding: "30px",
              border: "5px ridge #ff00ff",
              fontSize: "18px",
            }}
          >
            <p style={{ fontSize: "40px", marginBottom: "15px" }}>🍞</p>
            <p>NO BREAD POINTS YET!!!</p>
            <p style={{ marginTop: "10px" }}>
              <Link to="/bread" style={{ color: "#00ffff", textDecoration: "underline" }}>
                GO CLICK SOME BREAD →
              </Link>
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {valid.map((p, i) => {
              const isTop3 = i < 3;
              const medal = ["🥇", "🥈", "🥉"][i] || `#${i + 1}`;
              return (
                <Link
                  key={p.id}
                  to={`/profile/${p.user_id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background: p.user_id === currentUserId ? "#008080" : isTop3 ? "#800080" : "#000080",
                      border: `4px ridge ${isTop3 ? "#ff00ff" : "#00ff00"}`,
                      color: "#ffffff",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <div style={{ fontSize: "24px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                      {medal}
                    </div>
                    <AvatarDisplay avatar={p.avatar} avatarUrl={p.avatar_url} />
                    <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: "#ffff00",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.display_name}
                        {p.user_id === currentUserId && <span style={{ color: "#00ffff" }}> (YOU)</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: "#c0c0c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.user_email}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#00ff00" }}>
                        🍞 {(p.bread_points || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "11px", color: "#c0c0c0" }}>bread pts</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p style={{ color: "#ff00ff", fontSize: "12px", marginTop: "30px" }}>
          © 1999 Bread Leaderboard. Best viewed in Netscape Navigator.
        </p>
      </div>

      <style>{`
        @keyframes breadblink { 50% { opacity: 0; } }
        @keyframes breadmarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}