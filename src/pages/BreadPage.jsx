const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Link } from "react-router-dom";

const BREAD_BG = "https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/b8f9b14e2_image.png";

export default function BreadPage() {
  const [breadPoints, setBreadPoints] = useState(0);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);
  const unsavedRef = useRef(0);
  const [visitorNum] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    async function load() {
      const user = await db.auth.me();
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        profileRef.current = profiles[0];
        setBreadPoints(profiles[0].bread_points || 0);
      }
    }
    load();
  }, []);

  const savePoints = async () => {
    if (!profileRef.current || unsavedRef.current === 0) return;
    const toSave = unsavedRef.current;
    unsavedRef.current = 0;
    try {
      const updated = await db.entities.UserProfile.update(profileRef.current.id, {
        bread_points: (profileRef.current.bread_points || 0) + toSave,
      });
      profileRef.current = updated;
      setProfile(updated);
    } catch (e) {
      unsavedRef.current += toSave;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (unsavedRef.current > 0) savePoints();
    }, 5000);
    return () => {
      clearInterval(interval);
      if (unsavedRef.current > 0) savePoints();
    };
  }, []);

  const handleClick = () => {
    setBreadPoints((p) => p + 1);
    setClicks((c) => c + 1);
    unsavedRef.current += 1;
    if (unsavedRef.current >= 10) savePoints();
  };

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
      {/* Scratch iframe — corner */}
      <iframe
        src="https://scratch.mit.edu/projects/1320094677/embed"
        allowTransparency="true"
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          width: "300px",
          height: "200px",
          border: "4px ridge #ff00ff",
          zIndex: 100,
        }}
        title="Bread Scratch"
      />

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
          zIndex: 100,
        }}
      >
        ← BACK 2 HOME
      </Link>

      {/* Content */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "60px 20px 250px", textAlign: "center" }}>
        {/* Blinking title */}
        <h1
          style={{
            fontSize: "42px",
            color: "#ff00ff",
            textShadow: "3px 3px 0 #00ffff, -2px -2px 0 #ffff00",
            animation: "breadblink 1s steps(2) infinite",
            marginBottom: "10px",
          }}
        >
          ★彡 WELCOME 2 THE REALM OF BREAD 彡★
        </h1>

        {/* Marquee */}
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
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            🍞 BREAD IS LIFE 🍞 BREAD IS LOVE 🍞 BREAD IS ETERNAL 🍞 ALL HAIL THE BREAD GOD 🍞 BREAD IS LIFE 🍞 BREAD IS LOVE 🍞 BREAD IS ETERNAL 🍞 ALL HAIL THE BREAD GOD 🍞
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
            fontSize: "16px",
            marginBottom: "30px",
            transform: "rotate(-2deg)",
          }}
        >
          🚧 UNDER CONSTRUCTION 🚧
        </div>

        {/* Holy Bread God text */}
        <div
          style={{
            background: "#800080",
            color: "#ffffff",
            padding: "20px",
            border: "5px ridge #ff00ff",
            marginBottom: "30px",
            fontSize: "16px",
            lineHeight: "1.8",
            textAlign: "left",
          }}
        >
          <h2 style={{ textAlign: "center", color: "#ffff00", fontSize: "28px", marginBottom: "15px" }}>
            🍞 THE HOLY BREAD GOD 🍞
          </h2>
          <p>
            Hear ye, hear ye! The creator of this sacred page is none other than the{" "}
            <b style={{ color: "#00ffff" }}>HOLY BREAD GOD</b> themself!
          </p>
          <p>From the crumbs of the universe, They did bake all creation. Every loaf is a miracle. Every slice is a blessing.</p>
          <p>
            Those who click the bread shall be rewarded with <b style={{ color: "#00ff00" }}>BREAD POINTS</b> — the most sacred
            currency in all the land.
          </p>
          <p style={{ textAlign: "center", color: "#ffff00", marginTop: "15px" }}>🍞 ALL HAIL 🍞 ALL HAIL 🍞 ALL HAIL 🍞</p>
        </div>

        {/* Bread Clicker */}
        <div
          style={{
            background: "#008080",
            padding: "30px",
            border: "5px outset #00ffff",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ color: "#ffff00", fontSize: "24px", marginBottom: "10px" }}>🍞 BREAD CLICKER 9000 🍞</h2>
          <p style={{ color: "#ffffff", marginBottom: "20px" }}>CLICK THE BREAD 2 EARN BREAD POINTS!!!</p>
          <div style={{ fontSize: "28px", color: "#00ff00", fontWeight: "bold", marginBottom: "20px" }}>
            🍞 Bread Points: {breadPoints.toLocaleString()} 🍞
          </div>
          <button
            onClick={handleClick}
            style={{
              fontSize: "80px",
              background: "none",
              border: "none",
              cursor: "pointer",
              filter: "drop-shadow(4px 4px 0 #ff00ff)",
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🍞
          </button>
          <p style={{ color: "#ffff00", marginTop: "15px", fontSize: "14px" }}>Total Clicks: {clicks}</p>
        </div>

        {/* Leaderboard link */}
        <div style={{ marginBottom: "20px" }}>
          <Link
            to="/bread-leaderboard"
            style={{
              display: "inline-block",
              background: "#ff00ff",
              color: "#ffff00",
              padding: "8px 20px",
              border: "3px outset #cc00cc",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            🏆 BREAD LEADERBOARD 🏆
          </Link>
        </div>

        {/* Visitor counter */}
        <div
          style={{
            display: "inline-block",
            background: "#000000",
            color: "#00ff00",
            fontFamily: "monospace",
            fontSize: "20px",
            padding: "6px 16px",
            border: "3px inset #00ff00",
            marginBottom: "20px",
          }}
        >
          YOU R VISITOR # {visitorNum.toString().padStart(6, "0")}
        </div>

        <p style={{ color: "#ff00ff", fontSize: "14px", marginTop: "20px" }}>
          © 1999 Realm of Bread. All rites reserved. Best viewed in Netscape Navigator.
        </p>
      </div>

      <style>{`
        @keyframes breadblink { 50% { opacity: 0; } }
        @keyframes breadmarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}