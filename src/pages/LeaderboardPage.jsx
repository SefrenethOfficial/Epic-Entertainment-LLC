const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router-dom";
import { Trophy, Medal, Clock, ArrowLeft, Star, Flame, Gem, Calendar, CalendarDays } from "lucide-react";
import RoleBadge from "@/components/RoleBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const LOGO_URL = "https://media.base44.com/images/public/6a17c6f91d3259553949e1b4/9f1beaf37_Untitleddesign10.png";

function AvatarDisplay({ avatar, avatarUrl }) {
  if ((avatar === "custom" || avatar && avatar.startsWith("custom_db_")) && avatarUrl)
  return <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />;
  return <img src={LOGO_URL} alt="avatar" className="w-10 h-10 rounded-lg object-cover" />;
}

const RANK_STYLES = [
{ border: "border-yellow-400/60 bg-yellow-400/10", icon: <Trophy className="w-5 h-5 text-yellow-400" />, num: "text-yellow-400" },
{ border: "border-slate-300/50 bg-slate-300/10", icon: <Medal className="w-5 h-5 text-slate-300" />, num: "text-slate-300" },
{ border: "border-amber-600/50 bg-amber-600/10", icon: <Medal className="w-5 h-5 text-amber-600" />, num: "text-amber-600" }];

function PlayerRow({ profile, rank, currentUserId, stat, statLabel, statIcon }) {
  const style = rank < 3 ? RANK_STYLES[rank] : null;
  return (
    <Link to={`/profile/${profile.user_id}`} className="block">
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5 ${
      profile.user_id === currentUserId ?
      "border-primary/60 bg-primary/10" :
      style ?
      style.border :
      "border-border bg-secondary/30"}`
      }>
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {rank < 3 ?
          RANK_STYLES[rank].icon :
          <span className="font-bold text-sm text-muted-foreground">{rank + 1}</span>}
      </div>
      <AvatarDisplay avatar={profile.avatar} avatarUrl={profile.avatar_url} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
          {profile.display_name}
          <RoleBadge badge={profile.badge} email={profile.user_email} size="xs" />
          {profile.user_id === currentUserId &&
            <span className="ml-1 text-xs text-primary font-normal">(you)</span>
            }
        </p>
        
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {statIcon}
        <div className="text-right">
          <p className="font-bold text-primary text-sm">{stat}</p>
          <p className="text-xs text-muted-foreground">{statLabel}</p>
        </div>
      </div>
    </div>
    </Link>);

}

function MultiStatRow({ profile, rank, currentUserId }) {
  const style = rank < 3 ? RANK_STYLES[rank] : null;
  return (
    <Link to={`/profile/${profile.user_id}`} className="block">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5 ${
      profile.user_id === currentUserId ?
      "border-primary/60 bg-primary/10" :
      style ? style.border : "border-border bg-secondary/30"}`
      }>
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          {rank < 3 ? RANK_STYLES[rank].icon : <span className="font-bold text-sm text-muted-foreground">{rank + 1}</span>}
        </div>
        <AvatarDisplay avatar={profile.avatar} avatarUrl={profile.avatar_url} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
            {profile.display_name}
            <RoleBadge badge={profile.badge} email={profile.user_email} size="xs" />
            {profile.user_id === currentUserId && <span className="ml-1 text-xs text-primary font-normal">(you)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{profile.user_email}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-right">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-yellow-400">⭐ {(profile.points || 0).toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-cyan-400">💎 {profile.diamonds || 0}</span>
            <span className="text-[10px] text-muted-foreground">gems</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-orange-400">🔥 {profile.streak_days || 0}</span>
            <span className="text-[10px] text-muted-foreground">streak</span>
          </div>
        </div>
      </div>
    </Link>);

}

export default function LeaderboardPage() {
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    db.auth.me().then((u) => setCurrentUserId(u.id || ""));
  }, []);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: () => db.entities.UserProfile.list("-points", 100)
  });

  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => db.entities.Game.list("-play_count")
  });

  const validProfiles = profiles.filter((p) => p.display_name && !p.banned);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const byEpicBucks = [...validProfiles].sort((a, b) => (b.epicbucks || 0) - (a.epicbucks || 0));
  const byPoints = [...validProfiles].sort((a, b) => (b.points || 0) - (a.points || 0));
  const byPlaytime = [...validProfiles].sort((a, b) => (b.playtime_minutes || 0) - (a.playtime_minutes || 0));
  const byDiamonds = [...validProfiles].sort((a, b) => (b.diamonds || 0) - (a.diamonds || 0));
  const byStreak = [...validProfiles].sort((a, b) => (b.streak_days || 0) - (a.streak_days || 0));
  const byFish = [...validProfiles].sort((a, b) => (b.fish_count || 0) - (a.fish_count || 0));

  // Daily: players who logged in today, sorted by combined score
  const dailyPlayers = validProfiles.
  filter((p) => p.last_login_date === today).
  sort((a, b) => (b.points || 0) + (b.diamonds || 0) * 10 + (b.streak_days || 0) * 5 - (
  (a.points || 0) + (a.diamonds || 0) * 10 + (a.streak_days || 0) * 5));

  // Weekly: players active in the last 7 days, sorted by combined score
  const weeklyPlayers = validProfiles.
  filter((p) => p.last_login_date >= weekAgo).
  sort((a, b) => (b.points || 0) + (b.diamonds || 0) * 10 + (b.streak_days || 0) * 5 - (
  (a.points || 0) + (a.diamonds || 0) * 10 + (a.streak_days || 0) * 5));

  const formatTime = (mins) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h1 className="font-heading text-xl font-bold">Leaderboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {profilesLoading ?
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div> :

        <Tabs defaultValue="epicbucks">
            <TabsList className="bg-secondary mb-6 w-full sm:w-auto flex-wrap h-auto gap-1">
              <TabsTrigger value="epicbucks" className="gap-1.5">
                💵 EpicBucks
              </TabsTrigger>
              <TabsTrigger value="points" className="gap-1.5">
                <Star className="w-3.5 h-3.5" /> Points
              </TabsTrigger>
              <TabsTrigger value="diamonds" className="gap-1.5">
                <Gem className="w-3.5 h-3.5 text-cyan-400" /> Diamonds
              </TabsTrigger>
              <TabsTrigger value="playtime" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Playtime
              </TabsTrigger>
              <TabsTrigger value="streak" className="gap-1.5">
                🔥 Streaks
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Weekly
              </TabsTrigger>
              <TabsTrigger value="daily" className="gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Daily
              </TabsTrigger>
              <TabsTrigger value="fish" className="gap-1.5">
                🎣 Fish
              </TabsTrigger>
            </TabsList>

            <TabsContent value="epicbucks">
              <div className="space-y-2">
                {byEpicBucks.filter((p) => (p.epicbucks || 0) > 0).length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">💵</p>
                      <p className="text-muted-foreground">No EpicBucks yet — visit the Layer to print some!</p>
                    </div> :
              byEpicBucks.map((p, i) =>
              <PlayerRow key={p.id} profile={p} rank={i} currentUserId={currentUserId}
              stat={(p.epicbucks || 0).toLocaleString()} statLabel="bucks"
              statIcon={<span className="text-lg">💵</span>} />
              )}
              </div>
            </TabsContent>

            <TabsContent value="points">
              <div className="space-y-2">
                {byPoints.length === 0 ?
              <p className="text-center text-muted-foreground py-12">No players yet!</p> :
              byPoints.map((p, i) =>
              <PlayerRow
                key={p.id}
                profile={p}
                rank={i}
                currentUserId={currentUserId}
                stat={(p.points || 0).toLocaleString()}
                statLabel="pts"
                statIcon={<Star className="w-4 h-4 text-yellow-400" />} />

              )}
              </div>
            </TabsContent>

            <TabsContent value="diamonds">
              <div className="space-y-2">
                {byDiamonds.filter((p) => (p.diamonds || 0) > 0).length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">💎</p>
                      <p className="text-muted-foreground">No diamonds yet — play for 10+ minutes to earn your first!</p>
                    </div> :
              byDiamonds.map((p, i) =>
              <PlayerRow
                key={p.id}
                profile={p}
                rank={i}
                currentUserId={currentUserId}
                stat={(p.diamonds || 0).toLocaleString()}
                statLabel="💎"
                statIcon={<Gem className="w-4 h-4 text-cyan-400" />} />

              )}
              </div>
            </TabsContent>

            <TabsContent value="playtime">
              <div className="space-y-2">
                {byPlaytime.length === 0 ?
              <p className="text-center text-muted-foreground py-12">No playtime recorded yet!</p> :
              byPlaytime.map((p, i) =>
              <PlayerRow
                key={p.id}
                profile={p}
                rank={i}
                currentUserId={currentUserId}
                stat={formatTime(p.playtime_minutes || 0)}
                statLabel="played"
                statIcon={<Clock className="w-4 h-4 text-accent" />} />

              )}
              </div>
            </TabsContent>

            <TabsContent value="streak">
              <div className="space-y-2">
                {byStreak.filter((p) => (p.streak_days || 0) > 0).length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">🔥</p>
                      <p className="text-muted-foreground">No streaks yet — open the app daily to build one!</p>
                    </div> :
              byStreak.map((p, i) =>
              <PlayerRow
                key={p.id}
                profile={p}
                rank={i}
                currentUserId={currentUserId}
                stat={`${p.streak_days || 0} days`}
                statLabel="streak"
                statIcon={<span className="text-lg">🔥</span>} />

              )}
              </div>
            </TabsContent>

            <TabsContent value="weekly">
              <div className="space-y-2">
                {weeklyPlayers.length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">📅</p>
                      <p className="text-muted-foreground">No active players this week yet!</p>
                    </div> :
              weeklyPlayers.map((p, i) =>
              <MultiStatRow key={p.id} profile={p} rank={i} currentUserId={currentUserId} />
              )}
              </div>
            </TabsContent>

            <TabsContent value="daily">
              <div className="space-y-2">
                {dailyPlayers.length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">🌅</p>
                      <p className="text-muted-foreground">No one has logged in today yet — be the first!</p>
                    </div> :
              dailyPlayers.map((p, i) =>
              <MultiStatRow key={p.id} profile={p} rank={i} currentUserId={currentUserId} />
              )}
              </div>
            </TabsContent>
            <TabsContent value="fish">
              <div className="space-y-2">
                {byFish.filter((p) => (p.fish_count || 0) > 0).length === 0 ?
              <div className="text-center py-12">
                      <p className="text-4xl mb-3">🎣</p>
                      <p className="text-muted-foreground">No fish caught yet — find the whirlpool to start fishing!</p>
                    </div> :
              byFish.map((p, i) =>
              <PlayerRow
                key={p.id}
                profile={p}
                rank={i}
                currentUserId={currentUserId}
                stat={`${p.fish_count || 0} 🐟`}
                statLabel="fish"
                statIcon={<span className="text-lg">🎣</span>} />

              )}
              </div>
            </TabsContent>
          </Tabs>
        }
      </main>
    </div>);

}