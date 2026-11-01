const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, UserPlus, Settings, MessageSquare, Trophy, Megaphone, ShoppingBag, Gamepad2, Tv, AppWindow, Heart, Flame, ChevronRight, Menu, X, Star, LayoutGrid, Factory, Eye } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
"@/components/ui/alert-dialog";

import GameCard from "../components/games/GameCard";
import GameFormDialog from "../components/games/GameFormDialog";
import GamePlayer from "../components/games/GamePlayer";
import InviteDialog from "../components/games/InviteDialog";
import EmptyState from "../components/games/EmptyState";
import Splash from "./Splash";
import ProfileSettings from "../components/ProfileSettings";
import WhirlpoolIcon from "@/components/WhirlpoolIcon";
import DetectiveDialog from "@/components/DetectiveDialog";
import BreakingNewsBar from "@/components/BreakingNewsBar";
import { useIsMobile } from "@/hooks/use-mobile";
// MessagesEditor moved to dedicated /messages page
import VideoCard from "../components/videos/VideoCard";
import VideoFormDialog from "../components/videos/VideoFormDialog";
import VideoPlayer from "../components/videos/VideoPlayer";
import AccountSetupDialog from "../components/AccountSetupDialog";
import StreakToast from "../components/StreakToast";
import MysteryBoxDialog from "@/components/MysteryBoxDialog";
import ItemManager from "@/components/ItemManager";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";
const EDITOR_EMAILS = ["epocendie@gmail.com", "0322424@schoolsnet.act.edu.au"];
const TRENDING_THRESHOLD = 10;

const NAV_ITEMS = [
{ id: "games", label: "Games", icon: Gamepad2, emoji: "🎮" },
{ id: "favorites", label: "Favorites", icon: Heart, emoji: "❤️" },
{ id: "recent", label: "Recent", icon: Flame, emoji: "🆕" },
{ id: "tv", label: "TV", icon: Tv, emoji: "📺" },
{ id: "apps", label: "Apps", icon: AppWindow, emoji: "🧩" }];

function getBgStyle(profile) {
  if (!profile) return {};
  const type = profile.background_type;
  const value = profile.background_value;
  if (!type || type === "none" || !value) return {};
  if (type === "image") return { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
  return { background: value };
}

function AvatarDisplay({ profile }) {
  const { avatar, avatar_url } = profile || {};
  if ((avatar === "custom" || avatar?.startsWith("custom_db_")) && avatar_url)
  return <img src={avatar_url} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40" alt="avatar" />;
  return <img src={LOGO_URL} className="w-9 h-9 rounded-lg object-cover ring-2 ring-primary/40" alt="logo" />;
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("games");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [playingGame, setPlayingGame] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDetective, setShowDetective] = useState(false);
  // showMessages removed — messages now managed at /messages page
  const [search, setSearch] = useState("");
  const [deleteGame, setDeleteGame] = useState(null);
  const [orderedGames, setOrderedGames] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [streakToast, setStreakToast] = useState(null);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showItemManager, setShowItemManager] = useState(false);
  const playStartRef = useRef(null);

  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [defaultVideoCategory, setDefaultVideoCategory] = useState("other");

  const isEditor = EDITOR_EMAILS.includes(userEmail) || userRole === "admin";
  const bgStyle = getBgStyle(userProfile);
  const hasCustomBg = userProfile?.background_type && userProfile.background_type !== "none";
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const queryClient = useQueryClient();

  useEffect(() => {
    async function loadProfile() {
      const user = await db.auth.me();
      setUserRole(user.role || "user");
      setUserEmail(user.email || "");
      setUserId(user.id || "");
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        let p = profiles[0];
        if (p.banned) {
          db.auth.logout();
          return;
        }
        setUserProfile(p);
        if (!p.display_name) {
          setShowAccountSetup(true);
        } else {
          const today = new Date().toISOString().slice(0, 10);
          if (p.last_login_date !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            const isConsecutive = p.last_login_date === yesterday;
            const newStreak = isConsecutive ? (p.streak_days || 0) + 1 : 1;
            const bonusPoints = 20 * newStreak;
            const bonusDiamonds = newStreak % 7 === 0 ? Math.floor(newStreak / 7) : 0;
            const updated = await db.entities.UserProfile.update(p.id, {
              last_login_date: today,
              streak_days: newStreak,
              points: (p.points || 0) + bonusPoints,
              diamonds: (p.diamonds || 0) + bonusDiamonds
            });
            setUserProfile(updated);
            setStreakToast({ streak: newStreak, bonusPoints, bonusDiamonds });
          }
        }
      } else {
        setShowAccountSetup(true);
      }
    }
    loadProfile();
  }, []);

  const handleAccountSave = async ({ display_name, avatar, avatar_url }) => {
    const user = await db.auth.me();
    const saveData = { display_name, avatar, avatar_url: avatar_url || "", user_email: user.email };
    if (userProfile) {
      const updated = await db.entities.UserProfile.update(userProfile.id, saveData);
      setUserProfile(updated);
    } else {
      const created = await db.entities.UserProfile.create({ user_id: user.id, ...saveData, points: 0 });
      setUserProfile(created);
    }
    setShowAccountSetup(false);
  };

  const handleProfileSettingsClose = async () => {
    setShowProfile(false);
    const user = await db.auth.me();
    const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length > 0) setUserProfile(profiles[0]);
  };

  const favoriteIds = userProfile?.favorite_game_ids || [];

  const handleToggleFavorite = async (gameId) => {
    if (!userProfile) return;
    const current = userProfile.favorite_game_ids || [];
    const next = current.includes(gameId) ? current.filter((id) => id !== gameId) : [...current, gameId];
    const updated = await db.entities.UserProfile.update(userProfile.id, { favorite_game_ids: next });
    setUserProfile(updated);
  };

  const handlePlayGame = async (game) => {
    setPlayingGame(game);
    playStartRef.current = Date.now();
    if (userProfile) {
      const newPoints = (userProfile.points || 0) + 10;
      const playCounts = { ...(userProfile.game_play_counts || {}), [game.id]: ((userProfile.game_play_counts || {})[game.id] || 0) + 1 };
      const updated = await db.entities.UserProfile.update(userProfile.id, { points: newPoints, game_play_counts: playCounts });
      setUserProfile(updated);
    }
    await db.entities.Game.update(game.id, { play_count: (game.play_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ["games"] });
  };

  const handleDiamondEarned = async () => {
    if (!userProfile) return;
    const updated = await db.entities.UserProfile.update(userProfile.id, { diamonds: (userProfile.diamonds || 0) + 1 });
    setUserProfile(updated);
  };

  const handleCloseGame = async () => {
    if (playStartRef.current && userProfile) {
      const elapsedMins = Math.max(1, Math.round((Date.now() - playStartRef.current) / 60000));
      const updated = await db.entities.UserProfile.update(userProfile.id, { playtime_minutes: (userProfile.playtime_minutes || 0) + elapsedMins });
      setUserProfile(updated);
    }
    playStartRef.current = null;
    setPlayingGame(null);
  };

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: () => db.entities.Game.list("-play_count")
  });

  useEffect(() => {setOrderedGames(games);}, [games]);

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Game.create(data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["games"] });setShowForm(false);}
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Game.update(id, data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["games"] });setShowForm(false);setEditingGame(null);}
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Game.delete(id),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["games"] });setDeleteGame(null);}
  });

  const handleSave = async (formData) => {
    if (editingGame) await updateMutation.mutateAsync({ id: editingGame.id, data: formData });else
    await createMutation.mutateAsync(formData);
  };

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => db.entities.Video.list("-created_date")
  });

  const createVideoMutation = useMutation({
    mutationFn: (data) => db.entities.Video.create(data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["videos"] });setShowVideoForm(false);}
  });
  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Video.update(id, data),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["videos"] });setShowVideoForm(false);setEditingVideo(null);}
  });
  const deleteVideoMutation = useMutation({
    mutationFn: (id) => db.entities.Video.delete(id),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["videos"] });setDeleteVideo(null);}
  });

  const handleSaveVideo = async (formData) => {
    if (editingVideo) await updateVideoMutation.mutateAsync({ id: editingVideo.id, data: formData });else
    await createVideoMutation.mutateAsync(formData);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedGames);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedGames(items);
  };

  const filteredGames = orderedGames.filter(
    (g) => g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVideos = videos.filter(
    (v) => v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.description?.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  );

  const trendingGames = [...games].
  sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).
  filter((g) => (g.play_count || 0) >= TRENDING_THRESHOLD).
  slice(0, 3).
  map((g) => g.id);

  const onlyGames = filteredGames.filter((g) => !g.is_app);
  const onlyApps = filteredGames.filter((g) => g.is_app);
  const favoriteGames = onlyGames.filter((g) => favoriteIds.includes(g.id));

  // TV content: anime + movies + series
  const tvVideos = filteredVideos.filter((v) => ["anime", "movie", "series", "music", "other"].includes(v.category));

  const renderGameGrid = (gameList, emptyMsg = null) => {
    if (isLoading) return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);

    if (gameList.length === 0 && !search) {
      if (emptyMsg) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">💔</div>
          <h3 className="font-heading text-2xl font-bold mb-2">{emptyMsg}</h3>
        </div>);

      return <EmptyState onAdd={isEditor ? () => {setEditingGame(null);setShowForm(true);} : null} />;
    }
    if (gameList.length === 0) return <p className="text-center text-muted-foreground py-16">No results match "{search}"</p>;

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="games" direction="horizontal">
          {(provided) =>
          <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gameList.map((game, index) =>
            <Draggable key={game.id} draggableId={game.id} index={index}>
                  {(provided, snapshot) =>
              <div ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}>
                      <GameCard
                  game={game}
                  onPlay={handlePlayGame}
                  onEdit={(g) => {setEditingGame(g);setShowForm(true);}}
                  onDelete={setDeleteGame}
                  dragHandleProps={provided.dragHandleProps}
                  isEditor={isEditor}
                  isFavorite={favoriteIds.includes(game.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isTrending={trendingGames.includes(game.id)} />
                
                    </div>
              }
                </Draggable>
            )}
              {provided.placeholder}
            </div>
          }
        </Droppable>
      </DragDropContext>);

  };

  const handleNavSelect = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const handleAddContent = () => {
    if (activeTab === "tv") {setEditingVideo(null);setDefaultVideoCategory("anime");setShowVideoForm(true);} else
    {setEditingGame(null);setShowForm(true);}
  };

  // On the splash screen, show it with sidebar auto-opened (no blur backdrop)
  if (showSplash) return <>
  <Splash onEnter={() => {setShowSplash(false);setSidebarOpen(false);}} onDetective={() => setShowDetective(true)} isEditor={isEditor} onMysteryBox={() => setShowMysteryBox(true)} sidebarContent={
    <motion.aside
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed top-6 left-0 bottom-0 w-56 z-50 bg-card border-r border-border flex flex-col shadow-2xl hidden md:flex">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
        <span className="font-heading font-bold text-base text-foreground">Epic Entertainment</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-3">Content</p>
        {NAV_ITEMS.map((item) =>
        <button key={item.id} onClick={() => {setActiveTab(item.id);setShowSplash(false);}}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <span className="text-base">{item.emoji}</span>{item.label}
          </button>
        )}
        <div className="pt-4">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-3">Navigate</p>
          {[
          { href: "/leaderboard", emoji: "🏆", label: "Leaderboard" },
          { href: "/news", emoji: "📰", label: "News" },
          { href: "/threads", emoji: "💬", label: "Threads" },
          { href: "/shop", emoji: "🛍️", label: "Avatar Shop" }].
          map(({ href, emoji, label }) =>
          <a key={href} href={href} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <span className="text-base">{emoji}</span>{label}
          </a>
          )}
          </div>
          {/* Hidden whirlpool — fishing secret */}
          <div className="pt-2 pb-1 px-3">
          <a href="#/fishing" className="flex items-center justify-center gap-2 py-1.5 opacity-30 hover:opacity-100 transition-opacity group text-accent hover:text-cyan-300">
            <WhirlpoolIcon size={22} />
          </a>
          </div>
      </nav>
    </motion.aside>
    } />
  <DetectiveDialog open={showDetective} onOpenChange={setShowDetective} />
  </>;

  return (
    <div className="min-h-screen bg-background relative flex" style={bgStyle}>
      {hasCustomBg && <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />}

      {/* ─── SIDEBAR ─── */}
      <AnimatePresence>
        {sidebarOpen &&
        <>
            {/* Backdrop */}
            <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)} />
          
            {/* Drawer */}
            <motion.aside
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed z-50 bg-card border-border flex flex-col shadow-2xl ${isMobile ? "top-0 left-0 right-0 max-h-[85vh] border-b rounded-b-2xl" : "top-0 left-0 h-full w-72 border-r"}`}>
            
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="font-heading font-bold text-base text-foreground">Epic Entertainment</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User card */}
              {userProfile &&
            <div className="px-4 py-4 border-b border-border">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <button onClick={() => {setSidebarOpen(false);navigate(`/avatar`);}}>
                      <AvatarDisplay profile={userProfile} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{userProfile.display_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-primary font-bold">⭐ {(userProfile.points || 0).toLocaleString()}</span>
                        {(userProfile.diamonds || 0) > 0 && <span className="text-xs text-cyan-400 font-bold">💎 {userProfile.diamonds}</span>}
                        {(userProfile.streak_days || 0) > 0 && <span className="text-xs text-orange-400 font-bold">🔥 {userProfile.streak_days}</span>}
                      </div>
                    </div>
                    <Link to={`/profile/${userProfile.user_id}`} onClick={() => setSidebarOpen(false)}>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
            }

              {/* Nav Items */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-3">Content</p>
                {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ?
                    "bg-primary text-primary-foreground shadow-md shadow-primary/25" :
                    "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                    }>
                    
                      <span className="text-base">{item.emoji}</span>
                      {item.label}
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </button>);

              })}

                <div className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-3">Navigate</p>
                  <Link to="/leaderboard" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">🏆</span> Leaderboard
                    </div>
                  </Link>
                  <Link to="/news" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">📰</span> News
                    </div>
                  </Link>
                  <Link to="/shop" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">🛍️</span> Avatar Shop
                    </div>
                  </Link>
                  <Link to="/threads" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">💬</span> Threads
                    </div>
                  </Link>
                  <Link to="/avatar" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">🎭</span> My Avatar
                    </div>
                  </Link>
                  <Link to="/inventory" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">🎒</span> Inventory
                    </div>
                  </Link>
                  <Link to="/jeweler" onClick={() => setSidebarOpen(false)}>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <span className="text-base">💎</span> Jeweler
                    </div>
                  </Link>
                </div>

                {/* Hidden whirlpool — fishing secret */}
                <div className="pt-2 pb-1 px-3">
                  <Link to="/fishing" className="flex items-center justify-center gap-2 py-1.5 opacity-30 hover:opacity-100 transition-opacity group text-accent hover:text-cyan-300">
                    <WhirlpoolIcon size={22} />
                  </Link>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 mb-3">Settings</p>
                  <button onClick={() => {setSidebarOpen(false);setShowProfile(true);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    <span className="text-base">🎨</span> Background
                  </button>
                  {isEditor &&
                <button onClick={() => {setSidebarOpen(false);setShowItemManager(true);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    <span className="text-base">🗡️</span> Item Manager
                  </button>
                }
                  <button onClick={() => {setSidebarOpen(false);setShowInvite(true);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    <span className="text-base">👋</span> Invite Friends
                  </button>
                  {isEditor &&
                <Link to="/messages" onClick={() => setSidebarOpen(false)}>
                      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <span className="text-base">💬</span> Edit Messages
                      </div>
                    </Link>
                }
                </div>
              </nav>

              {/* Add content button for editors */}
              {isEditor &&
            <div className="px-4 py-4 border-t border-border">
                  <Button onClick={() => {setSidebarOpen(false);handleAddContent();}} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add {activeTab === "tv" ? "TV Content" : activeTab === "apps" ? "App" : "Game"}
                  </Button>
                </div>
            }
            </motion.aside>
          </>
        }
      </AnimatePresence>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 pt-6">
        {/* Top Header */}
        <header className="sticky top-6 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex-shrink-0">
              
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Logo + Title */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-lg object-cover hidden sm:block" />
              <h1 className="font-heading text-lg font-bold text-foreground hidden sm:block">Epic Entertainment</h1>
              <button onClick={() => setShowMysteryBox(true)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all hover:scale-110" title="Mystery Box">
                <span className="text-base">🎁</span>
              </button>
            </div>

            {/* Active Tab Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm">{NAV_ITEMS.find((n) => n.id === activeTab)?.emoji}</span>
              <span className="text-sm font-semibold text-primary">{NAV_ITEMS.find((n) => n.id === activeTab)?.label}</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 bg-secondary border-0 h-9" />
            </div>

            {/* Right side: quick links */}
            <div className="flex items-center gap-1.5">
              <Link to="/leaderboard">
                <Button variant="ghost" size="icon" title="Leaderboard" className="h-9 w-9">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </Button>
              </Link>
              <Link to="/news">
                <Button variant="ghost" size="icon" title="News" className="h-9 w-9">
                  <Megaphone className="w-4 h-4 text-primary" />
                </Button>
              </Link>

              {/* User avatar */}
              {userProfile &&
              <button onClick={() => setShowAccountSetup(true)} className="flex-shrink-0 ml-1">
                  <AvatarDisplay profile={userProfile} />
                </button>
              }
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full opacity-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              
              {/* GAMES tab */}
              {activeTab === "games" &&
              <div className="ml-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">🎮 Games</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">{onlyGames.length} game{onlyGames.length !== 1 ? "s" : ""} available</p>
                    </div>
                    {isEditor &&
                  <Button onClick={() => {setEditingGame(null);setIsAddingApp(false);setShowForm(true);}} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Game
                      </Button>
                  }
                  </div>
                  {renderGameGrid(onlyGames)}
                </div>
              }

              {/* FAVORITES tab */}
              {activeTab === "favorites" &&
              <div>
                  <div className="mb-6">
                    <h2 className="font-heading text-2xl font-bold">❤️ Favorites</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Your saved games</p>
                  </div>
                  {renderGameGrid(favoriteGames.filter((g) => !g.is_app), "No favorites yet — heart a game!")}
                </div>
              }

              {/* RECENT tab */}
              {activeTab === "recent" &&
              <div>
                  <div className="mb-6">
                    <h2 className="font-heading text-2xl font-bold">🆕 Recent</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Newest games added</p>
                  </div>
                  {renderGameGrid(
                  [...onlyGames].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
                  "No games yet!"
                )}
                </div>
              }

              {/* TV tab — anime, movies, series */}
              {activeTab === "tv" &&
              <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">📺 TV</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">Anime, Movies &amp; Series</p>
                    </div>
                    {isEditor &&
                  <Button onClick={() => {setEditingVideo(null);setDefaultVideoCategory("anime");setShowVideoForm(true);}} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Content
                      </Button>
                  }
                  </div>

                  {/* Category sub-sections */}
                  {videosLoading ?
                <div className="flex items-center justify-center py-24">
                      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    </div> :
                tvVideos.length === 0 ?
                <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="text-5xl mb-4">📺</div>
                      <h3 className="font-heading text-2xl font-bold mb-2">No TV content yet</h3>
                      <p className="text-muted-foreground mb-4">Add anime, movies, or series via Google Drive or YouTube.</p>
                      {isEditor && <Button onClick={() => {setEditingVideo(null);setDefaultVideoCategory("anime");setShowVideoForm(true);}} className="gap-2"><Plus className="w-4 h-4" /> Add Content</Button>}
                    </div> :

                <div className="space-y-10">
                      {[
                  { key: "other", label: "🎞️ Videos" },
                  { key: "anime", label: "🎌 Anime" },
                  { key: "series", label: "📡 Series" },
                  { key: "movie", label: "🎬 Movies" },
                  { key: "music", label: "🎵 Music" }].
                  map(({ key, label }) => {
                    const items = filteredVideos.filter((v) => v.category === key);
                    if (items.length === 0) return null;
                    return (
                      <div key={key}>
                            <h3 className="font-heading font-bold text-lg mb-4">{label}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                              {items.map((video) =>
                          <VideoCard key={video.id} video={video} onPlay={setPlayingVideo} onEdit={(v) => {setEditingVideo(v);setShowVideoForm(true);}} onDelete={setDeleteVideo} isEditor={isEditor} />
                          )}
                            </div>
                          </div>);

                  })}
                    </div>
                }
                </div>
              }

              {/* APPS tab */}
              {activeTab === "apps" &&
              <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">🧩 Apps</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">{onlyApps.length} app{onlyApps.length !== 1 ? "s" : ""} available</p>
                    </div>
                    {isEditor &&
                  <Button onClick={() => {setEditingGame(null);setShowForm(true);setIsAddingApp(true);}} className="gap-2">
                        <Plus className="w-4 h-4" /> Add App
                      </Button>
                  }
                  </div>
                  {renderGameGrid(onlyApps, "No apps yet!")}
                </div>
              }
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Layer — factory corner (bottom-left) */}
      <Link to="/layer" className="fixed bottom-5 left-5 z-30 group">
        <div className="w-12 h-12 rounded-xl bg-secondary/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-30 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-primary">
          <Factory className="w-5 h-5 text-foreground" />
        </div>
      </Link>

      {/* Detective — suspect corner (bottom-right) */}
      <button onClick={() => setShowDetective(true)} className="fixed bottom-5 right-5 z-30 group">
        <div className="w-12 h-12 rounded-xl bg-secondary/80 backdrop-blur border border-border flex items-center justify-center shadow-2xl opacity-30 hover:opacity-100 transition-all group-hover:scale-110 group-hover:border-destructive">
          <Eye className="w-5 h-5 text-foreground" />
        </div>
      </button>

      {/* Sefreneths Emporium door — bottom center */}
      <Link to="/emporium" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 group" title="Sefreneths Emporium">
        <img
          src="https://media.base44.com/images/public/6a18f1d4f3f3b8019568b022/a488ccfeb_image.png"
          alt="Sefreneths Emporium"
          className="h-28 opacity-50 hover:opacity-100 transition-all duration-300 group-hover:scale-105"
          style={{ mixBlendMode: "lighten" }} />
        
      </Link>

      {/* Breaking news bar — top, editor-editable */}
      <BreakingNewsBar isEditor={isEditor} />

      {/* Dialogs */}
      <GameFormDialog open={showForm} onOpenChange={(v) => {setShowForm(v);if (!v) {setEditingGame(null);setIsAddingApp(false);}}} game={editingGame} onSave={handleSave} isApp={isAddingApp} />
      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
      <ProfileSettings open={showProfile} onClose={handleProfileSettingsClose} onProfileUpdate={() => {}} />
      {/* MessagesEditor moved to /messages dedicated page */}
      <VideoFormDialog open={showVideoForm} onOpenChange={(v) => {setShowVideoForm(v);if (!v) setEditingVideo(null);}} video={editingVideo} onSave={handleSaveVideo} defaultCategory={defaultVideoCategory} />

      <AlertDialog open={!!deleteGame} onOpenChange={() => setDeleteGame(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteGame?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteGame.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteVideo} onOpenChange={() => setDeleteVideo(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteVideo?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVideoMutation.mutate(deleteVideo.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {playingGame && <GamePlayer game={playingGame} onClose={handleCloseGame} onDiamondEarned={handleDiamondEarned} />}
      {streakToast && <StreakToast streak={streakToast.streak} bonusPoints={streakToast.bonusPoints} bonusDiamonds={streakToast.bonusDiamonds} onDone={() => setStreakToast(null)} />}
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}

      <AccountSetupDialog
        open={showAccountSetup}
        onSave={handleAccountSave}
        existingName={userProfile?.display_name || ""}
        existingAvatar={userProfile?.avatar || "logo"}
        existingAvatarUrl={userProfile?.avatar_url || ""}
        isEditor={isEditor} />
      <DetectiveDialog open={showDetective} onOpenChange={setShowDetective} />
      <MysteryBoxDialog open={showMysteryBox} onOpenChange={setShowMysteryBox} userProfile={userProfile} setUserProfile={setUserProfile} />
      <ItemManager open={showItemManager} onOpenChange={setShowItemManager} />
    </div>);

}