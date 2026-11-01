const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Check, X, ShieldCheck, Ban } from "lucide-react";
import RoleBadge, { ROLES, OWNER_EMAILS } from "@/components/RoleBadge";
import CommentsSection from "@/components/CommentsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";

const ACHIEVEMENTS = [
  // 🎮 Games Played
  { id: "first_game",   label: "First Play",      icon: "🎮", desc: "Played your first game",           check: (p) => Object.keys(p.game_play_counts || {}).length >= 1 },
  { id: "play3",        label: "Warming Up",       icon: "🕹️", desc: "Played 3 different games",         check: (p) => Object.keys(p.game_play_counts || {}).length >= 3 },
  { id: "play5",        label: "Gamer",            icon: "👾", desc: "Played 5 different games",         check: (p) => Object.keys(p.game_play_counts || {}).length >= 5 },
  { id: "play10",       label: "Addict",           icon: "🎯", desc: "Played 10 different games",        check: (p) => Object.keys(p.game_play_counts || {}).length >= 10 },
  { id: "play15",       label: "Collector",        icon: "🗂️", desc: "Played 15 different games",        check: (p) => Object.keys(p.game_play_counts || {}).length >= 15 },
  { id: "play25",       label: "Library Card",     icon: "📚", desc: "Played 25 different games",        check: (p) => Object.keys(p.game_play_counts || {}).length >= 25 },
  { id: "play50",       label: "Encyclopedia",     icon: "🌐", desc: "Played 50 different games",        check: (p) => Object.keys(p.game_play_counts || {}).length >= 50 },

  // 🔥 Streaks
  { id: "streak2",      label: "Back Again",       icon: "✌️", desc: "2-day login streak",               check: (p) => (p.streak_days || 0) >= 2 },
  { id: "streak3",      label: "On Fire",          icon: "🔥", desc: "3-day login streak",               check: (p) => (p.streak_days || 0) >= 3 },
  { id: "streak5",      label: "Dedicated",        icon: "📅", desc: "5-day login streak",               check: (p) => (p.streak_days || 0) >= 5 },
  { id: "streak7",      label: "Week Warrior",     icon: "⚡", desc: "7-day login streak",               check: (p) => (p.streak_days || 0) >= 7 },
  { id: "streak14",     label: "Two Weeks Strong", icon: "💪", desc: "14-day login streak",              check: (p) => (p.streak_days || 0) >= 14 },
  { id: "streak30",     label: "Legendary",        icon: "👑", desc: "30-day login streak",              check: (p) => (p.streak_days || 0) >= 30 },
  { id: "streak60",     label: "Immortal",         icon: "🧬", desc: "60-day login streak",              check: (p) => (p.streak_days || 0) >= 60 },
  { id: "streak100",    label: "Centurion",        icon: "🏅", desc: "100-day login streak",             check: (p) => (p.streak_days || 0) >= 100 },

  // 💎 Diamonds
  { id: "diamond1",     label: "Shiny Find",       icon: "💎", desc: "Earned your first diamond",        check: (p) => (p.diamonds || 0) >= 1 },
  { id: "diamond5",     label: "Gem Lover",        icon: "💠", desc: "Earned 5 diamonds",                check: (p) => (p.diamonds || 0) >= 5 },
  { id: "diamond10",    label: "Gem Collector",    icon: "🔷", desc: "Earned 10 diamonds",               check: (p) => (p.diamonds || 0) >= 10 },
  { id: "diamond25",    label: "Jeweler",          icon: "💍", desc: "Earned 25 diamonds",               check: (p) => (p.diamonds || 0) >= 25 },
  { id: "diamond50",    label: "Diamond Mogul",    icon: "👸", desc: "Earned 50 diamonds",               check: (p) => (p.diamonds || 0) >= 50 },
  { id: "diamond100",   label: "Diamond King",     icon: "🤴", desc: "Earned 100 diamonds",              check: (p) => (p.diamonds || 0) >= 100 },

  // ⏱️ Playtime
  { id: "playtime10",   label: "Just Started",     icon: "🌱", desc: "10 minutes of playtime",           check: (p) => (p.playtime_minutes || 0) >= 10 },
  { id: "playtime30",   label: "Getting Comfy",    icon: "🛋️", desc: "30 minutes of playtime",           check: (p) => (p.playtime_minutes || 0) >= 30 },
  { id: "playtime60",   label: "Hour Hero",        icon: "⏰", desc: "1 hour of playtime",               check: (p) => (p.playtime_minutes || 0) >= 60 },
  { id: "playtime180",  label: "Absorbed",         icon: "🌀", desc: "3 hours of playtime",              check: (p) => (p.playtime_minutes || 0) >= 180 },
  { id: "playtime300",  label: "No Life Signs",    icon: "📡", desc: "5 hours of playtime",              check: (p) => (p.playtime_minutes || 0) >= 300 },
  { id: "playtime600",  label: "Marathon",         icon: "🏆", desc: "10 hours of playtime",             check: (p) => (p.playtime_minutes || 0) >= 600 },
  { id: "playtime1200", label: "Veteran",          icon: "🎖️", desc: "20 hours of playtime",             check: (p) => (p.playtime_minutes || 0) >= 1200 },
  { id: "playtime3000", label: "Time Traveler",    icon: "⌛", desc: "50 hours of playtime",             check: (p) => (p.playtime_minutes || 0) >= 3000 },

  // ⭐ Points
  { id: "points100",    label: "First Hundred",    icon: "💯", desc: "100 points earned",                check: (p) => (p.points || 0) >= 100 },
  { id: "points500",    label: "Point Hoarder",    icon: "⭐", desc: "500 points earned",                check: (p) => (p.points || 0) >= 500 },
  { id: "points1000",   label: "Grand",            icon: "🌟", desc: "1,000 points earned",              check: (p) => (p.points || 0) >= 1000 },
  { id: "points2500",   label: "High Roller",      icon: "🎰", desc: "2,500 points earned",              check: (p) => (p.points || 0) >= 2500 },
  { id: "points5000",   label: "Elite",            icon: "🥇", desc: "5,000 points earned",              check: (p) => (p.points || 0) >= 5000 },
  { id: "points10000",  label: "Millionaire",      icon: "💰", desc: "10,000 points earned",             check: (p) => (p.points || 0) >= 10000 },
  { id: "points50000",  label: "Tycoon",           icon: "🏦", desc: "50,000 points earned",             check: (p) => (p.points || 0) >= 50000 },

  // ❤️ Favorites
  { id: "fav1",         label: "First Fave",       icon: "💛", desc: "Favorited your first game",        check: (p) => (p.favorite_game_ids || []).length >= 1 },
  { id: "fav3",         label: "Picky Gamer",      icon: "🎀", desc: "Favorited 3 games",                check: (p) => (p.favorite_game_ids || []).length >= 3 },
  { id: "fav5",         label: "Curator",          icon: "❤️", desc: "Favorited 5 games",                check: (p) => (p.favorite_game_ids || []).length >= 5 },
  { id: "fav10",        label: "Connoisseur",      icon: "🎨", desc: "Favorited 10 games",               check: (p) => (p.favorite_game_ids || []).length >= 10 },
  { id: "fav20",        label: "Archivist",        icon: "🗃️", desc: "Favorited 20 games",               check: (p) => (p.favorite_game_ids || []).length >= 20 },

  // 🛍️ Shop
  { id: "shop1",        label: "Shopaholic",       icon: "🛍️", desc: "Purchased an avatar from the shop", check: (p) => (p.owned_avatar_ids || []).length >= 1 },
  { id: "shop3",        label: "Fashion Icon",     icon: "👗", desc: "Purchased 3 avatars from the shop", check: (p) => (p.owned_avatar_ids || []).length >= 3 },
  { id: "shop5",        label: "Wardrobe Hoarder", icon: "🪄", desc: "Purchased 5 avatars from the shop", check: (p) => (p.owned_avatar_ids || []).length >= 5 },

  // 🎭 Special / Misc
  { id: "bio",          label: "Got Something to Say", icon: "📝", desc: "Wrote a bio",                  check: (p) => !!(p.bio && p.bio.trim().length > 0) },
  { id: "bg",           label: "Interior Designer", icon: "🎨", desc: "Set a custom background",         check: (p) => !!(p.background_type && p.background_type !== "none") },
  { id: "total_plays50",label: "Dedicated Player", icon: "🏋️", desc: "Played games 50 times total",      check: (p) => Object.values(p.game_play_counts || {}).reduce((a, b) => a + b, 0) >= 50 },
  { id: "total_plays200",label: "Unstoppable",     icon: "🚀", desc: "Played games 200 times total",     check: (p) => Object.values(p.game_play_counts || {}).reduce((a, b) => a + b, 0) >= 200 },
  { id: "total_plays500",label: "Game Machine",    icon: "🤖", desc: "Played games 500 times total",     check: (p) => Object.values(p.game_play_counts || {}).reduce((a, b) => a + b, 0) >= 500 },
];

function AvatarDisplay({ avatar, avatarUrl, size = "lg" }) {
  const sizeClass = size === "lg" ? "w-20 h-20" : "w-10 h-10";
  const roundClass = size === "lg" ? "rounded-2xl" : "rounded-lg";
  if ((avatar === "custom" || avatar?.startsWith("custom_db_")) && avatarUrl)
    return <img src={avatarUrl} alt="avatar" className={`${sizeClass} rounded-full object-cover`} />;
  return <img src={LOGO_URL} alt="avatar" className={`${sizeClass} ${roundClass} object-cover`} />;
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border min-w-[80px]">
      <span className="text-2xl">{icon}</span>
      <p className="font-bold text-foreground text-sm">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AchievementBadge({ achievement, unlocked }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
        unlocked
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-secondary/20 opacity-40 grayscale"
      }`}
    >
      <span className="text-2xl">{achievement.icon}</span>
      <p className="text-xs font-semibold text-foreground leading-tight">{achievement.label}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{achievement.desc}</p>
      {unlocked && <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-0">Unlocked</Badge>}
    </motion.div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [editingStats, setEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState({});
  const [savingStats, setSavingStats] = useState(false);
  const [banning, setBanning] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then((u) => {
      setCurrentUserId(u.id || "");
      setCurrentUserEmail(u.email || "");
      setCurrentUserRole(u.role || "");
    }).catch(() => {});
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => db.entities.UserProfile.filter({ user_id: userId }),
  });

  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => db.entities.Game.list(),
  });

  const profile = profiles[0];

  useEffect(() => {
    if (profile?.bio !== undefined) setBioValue(profile.bio || "");
  }, [profile?.bio]);

  const handleSaveBio = async () => {
    if (!profile) return;
    setSavingBio(true);
    await db.entities.UserProfile.update(profile.id, { bio: bioValue });
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    setSavingBio(false);
    setEditingBio(false);
  };

  const formatTime = (mins) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Most played games
  const mostPlayed = React.useMemo(() => {
    if (!profile?.game_play_counts || !games.length) return [];
    return Object.entries(profile.game_play_counts)
      .map(([gameId, count]) => ({ game: games.find((g) => g.id === gameId), count }))
      .filter((e) => e.game)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [profile, games]);

  const categoryIcons = { action: "🎯", puzzle: "🧩", arcade: "👾", strategy: "♟️", casual: "🎮", other: "🕹️" };

  const unlockedAchievements = profile ? ACHIEVEMENTS.filter((a) => a.check(profile)) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-4xl">😕</p>
        <p className="text-muted-foreground">Profile not found.</p>
        <Link to="/leaderboard" className="text-primary hover:underline text-sm">← Back to Leaderboard</Link>
      </div>
    );
  }

  const isOwnProfile = profile.user_id === currentUserId;
  const isEditor = EDITOR_EMAILS.includes(currentUserEmail) || currentUserRole === "admin";
  const isOwner = OWNER_EMAILS.includes(currentUserEmail);

  const handleOpenStatsEdit = () => {
    setStatsForm({
      display_name: profile.display_name || "",
      points: profile.points || 0,
      diamonds: profile.diamonds || 0,
      playtime_minutes: profile.playtime_minutes || 0,
      streak_days: profile.streak_days || 0,
    });
    setEditingStats(true);
  };

  const handleToggleBan = async () => {
    if (!profile) return;
    setBanning(true);
    await db.entities.UserProfile.update(profile.id, { banned: !profile.banned });
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    setBanning(false);
  };

  const handleChangeBadge = async (badge) => {
    if (!profile) return;
    await db.entities.UserProfile.update(profile.id, { badge });
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const handleSaveStats = async () => {
    setSavingStats(true);
    await db.entities.UserProfile.update(profile.id, {
      display_name: statsForm.display_name,
      points: Number(statsForm.points),
      diamonds: Number(statsForm.diamonds),
      playtime_minutes: Number(statsForm.playtime_minutes),
      streak_days: Number(statsForm.streak_days),
    });
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    setSavingStats(false);
    setEditingStats(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/leaderboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Leaderboard</span>
            </button>
          </Link>
          <h1 className="font-heading text-lg font-bold">Player Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-5"
        >
          <AvatarDisplay avatar={profile.avatar} avatarUrl={profile.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-2xl font-bold">{profile.display_name}</h2>
              <RoleBadge badge={profile.badge} email={profile.user_email} />
              {isOwnProfile && <Badge variant="outline" className="text-xs">You</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{profile.user_email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-orange-400 font-semibold">🔥 {profile.streak_days || 0} day streak</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{unlockedAchievements.length}/{ACHIEVEMENTS.length} achievements</span>
            </div>

            {/* Bio section */}
            <div className="mt-3">
              {editingBio ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full rounded-lg bg-secondary border border-border text-sm text-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={3}
                    maxLength={200}
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    placeholder="Write something about yourself..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveBio} disabled={savingBio} className="h-7 px-3 text-xs gap-1">
                      <Check className="w-3 h-3" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBioValue(profile.bio || ""); }} className="h-7 px-3 text-xs gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">{bioValue.length}/200</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-sm text-muted-foreground italic flex-1">
                    {profile.bio ? profile.bio : isOwnProfile ? "No bio yet." : "No bio yet."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingBio(true)}
                      className="h-7 px-2.5 text-xs gap-1 flex-shrink-0"
                    >
                      <Pencil className="w-3 h-3" /> Edit Bio
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Stats</h3>
          <div className="flex flex-wrap gap-3">
            <StatCard icon="⭐" label="Points" value={(profile.points || 0).toLocaleString()} />
            <StatCard icon="💎" label="Diamonds" value={(profile.diamonds || 0).toLocaleString()} />
            <StatCard icon="⏱️" label="Playtime" value={formatTime(profile.playtime_minutes)} />
            <StatCard icon="🔥" label="Streak" value={`${profile.streak_days || 0}d`} />
            <StatCard icon="❤️" label="Favorites" value={(profile.favorite_game_ids || []).length} />
            <StatCard icon="🎮" label="Games" value={Object.keys(profile.game_play_counts || {}).length} />
          </div>
        </motion.div>

        {/* Most Played Games */}
        {mostPlayed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Most Played</h3>
            <div className="space-y-2">
              {mostPlayed.map(({ game, count }, i) => (
                <div key={game.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30">
                  <span className={`w-6 font-bold text-sm ${i < 3 ? ["text-yellow-400", "text-slate-300", "text-amber-600"][i] : "text-muted-foreground"}`}>
                    #{i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {game.thumbnail_url
                      ? <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">{categoryIcons[game.category] || "🕹️"}</div>
                    }
                  </div>
                  <p className="flex-1 font-medium text-foreground truncate">{game.title}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{count}x played</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Achievements</h3>
            <span className="text-xs text-primary font-semibold">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ACHIEVEMENTS.map((a) => (
              <AchievementBadge key={a.id} achievement={a} unlocked={profile ? a.check(profile) : false} />
            ))}
          </div>
        </motion.div>

        {/* Comments on this profile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <CommentsSection targetType="profile" targetId={userId} />
        </motion.div>

        {/* Editor Moderation Panel */}
        {isEditor && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm text-primary uppercase tracking-wider">Moderation</h3>
                {profile.banned && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">BANNED</span>}
              </div>
              <div className="flex items-center gap-2">
                {!isOwnProfile && (
                  <Button
                    size="sm"
                    variant={profile.banned ? "outline" : "destructive"}
                    onClick={handleToggleBan}
                    disabled={banning}
                    className="h-7 px-2.5 text-xs gap-1"
                  >
                    <Ban className="w-3 h-3" /> {profile.banned ? "Unban" : "Ban"}
                  </Button>
                )}
                {!editingStats && (
                  <Button size="sm" variant="outline" onClick={handleOpenStatsEdit} className="h-7 px-2.5 text-xs gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                )}
              </div>
            </div>

            {editingStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                    <Input value={statsForm.display_name} onChange={e => setStatsForm(f => ({...f, display_name: e.target.value}))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Points</label>
                    <Input type="number" value={statsForm.points} onChange={e => setStatsForm(f => ({...f, points: e.target.value}))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Diamonds</label>
                    <Input type="number" value={statsForm.diamonds} onChange={e => setStatsForm(f => ({...f, diamonds: e.target.value}))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Playtime (minutes)</label>
                    <Input type="number" value={statsForm.playtime_minutes} onChange={e => setStatsForm(f => ({...f, playtime_minutes: e.target.value}))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Streak (days)</label>
                    <Input type="number" value={statsForm.streak_days} onChange={e => setStatsForm(f => ({...f, streak_days: e.target.value}))} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveStats} disabled={savingStats} className="h-7 px-3 text-xs gap-1">
                    <Check className="w-3 h-3" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingStats(false)} className="h-7 px-3 text-xs gap-1">
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {[
                  ["Display Name", profile.display_name],
                  ["Points", (profile.points || 0).toLocaleString()],
                  ["Diamonds", (profile.diamonds || 0).toLocaleString()],
                  ["Playtime", `${profile.playtime_minutes || 0} min`],
                  ["Streak", `${profile.streak_days || 0} days`],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Badge changer — owner only */}
            {isOwner && !isOwnProfile && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Role Badge</h4>
                <div className="space-y-1.5">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleChangeBadge(role.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                        (profile.badge || "member") === role.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full border px-2 py-0.5 flex-shrink-0 ${role.className}`}>
                        {role.icon} {role.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{role.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}