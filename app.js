import * as api from "./backend.js";

const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");
const CATEGORIES = ["all", "action", "arcade", "puzzle", "strategy", "casual", "other"];

const state = {
  user: undefined, // undefined = still checking, null = signed out
  games: null,
  gamesError: null,
  category: "all",
  search: "",
  lastPointsAt: 0,
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), ms);
}

function hue(str) {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function avatarHtml(name, photo) {
  if (photo) return `<img class="avatar" src="${esc(photo)}" alt="" referrerpolicy="no-referrer" />`;
  return `<span class="avatar fallback">${esc((name || "?")[0].toUpperCase())}</span>`;
}

/* ---------- Header ---------- */
function renderHeader() {
  const area = $("#userArea");
  const u = state.user;
  $("#tabs").hidden = !u;
  if (!u) { area.innerHTML = ""; return; }
  area.innerHTML = `
    ${u.isAdmin ? `<button class="btn primary small" id="addGameBtn">＋ Add game</button><span class="admin-badge">ADMIN</span>` : ""}
    <span class="points-pill" title="Points: +${api.POINTS_PER_PLAY} each time you start a game (once a minute)">⭐ <span id="pointsVal">${(u.profile.points || 0).toLocaleString()}</span></span>
    ${avatarHtml(u.displayName, u.photoURL)}
    <button class="btn ghost small" id="signOutBtn">Sign out</button>`;
  $("#signOutBtn").onclick = () => api.signOut();
  if (u.isAdmin) $("#addGameBtn").onclick = () => openEditor(null);
  const tab = (location.hash.replace(/^#\//, "") || "games").split("/")[0];
  document.querySelectorAll("#tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
}

function updatePoints() {
  const el = $("#pointsVal");
  if (el && state.user) el.textContent = (state.user.profile.points || 0).toLocaleString();
}

/* ---------- Views ---------- */
function renderSignedOut() {
  if (!api.configured) {
    view.innerHTML = `
      <section class="hero"><div class="hero-inner">
        <div class="hero-hat">🎩</div>
        <h1>Epic <span>Entertainment</span></h1>
        <div class="setup-box">
          <strong>Almost ready.</strong> This site needs its Firebase settings before anyone can sign in.
          Paste the web app config into <code>firebase-config.js</code>.
        </div>
      </div></section>`;
    return;
  }
  view.innerHTML = `
    <section class="hero"><div class="hero-inner">
      <div class="hero-hat">🎩</div>
      <h1>Epic <span>Entertainment</span></h1>
      <p>Your games await. Sign in to play, earn points and climb the leaderboard.</p>
      <button class="btn google" id="signInBtn">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Sign in with Google
      </button>
      <p class="fine">We only use your Google name and picture for your profile.</p>
    </div></section>`;
  $("#signInBtn").onclick = async (e) => {
    e.currentTarget.disabled = true;
    try { await api.signIn(); }
    catch (err) {
      e.currentTarget.disabled = false;
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        toast("Sign-in failed: " + (err?.code || err?.message || err), 5000);
      }
    }
  };
}

function gameCard(g) {
  const fav = (state.user.profile.favorites || []).includes(g.id);
  const thumb = g.thumbnail
    ? `<img class="thumb" src="${esc(g.thumbnail)}" alt="" loading="lazy" />`
    : `<div class="thumb gen" style="background:linear-gradient(135deg,hsl(${hue(g.title)} 70% 45%),hsl(${(hue(g.title) + 60) % 360} 70% 30%))">${esc((g.title || "?")[0].toUpperCase())}</div>`;
  return `
    <article class="card" tabindex="0" data-id="${esc(g.id)}" aria-label="Play ${esc(g.title)}">
      ${thumb}
      <button class="fav" data-fav="${esc(g.id)}" aria-label="${fav ? "Remove from" : "Add to"} favorites" title="${fav ? "Remove from" : "Add to"} favorites">${fav ? "❤️" : "🤍"}</button>
      ${state.user.isAdmin ? `<div class="admin-tools"><button data-edit="${esc(g.id)}" title="Edit" aria-label="Edit">✏️</button><button data-del="${esc(g.id)}" title="Delete" aria-label="Delete">🗑️</button></div>` : ""}
      <div class="card-body">
        <h3 class="card-title">${esc(g.title)}</h3>
        ${g.description ? `<p class="card-desc">${esc(g.description)}</p>` : ""}
        <div class="card-meta"><span class="tag">${esc(g.category || "other")}</span><span>▶ ${(g.playCount || 0).toLocaleString()}</span></div>
      </div>
    </article>`;
}

function renderGames(favOnly) {
  const title = favOnly ? "Favorites" : "Games";
  if (state.gamesError) {
    view.innerHTML = `<div class="empty"><div class="big">⚠️</div><h2>Couldn't load games</h2><p>${esc(state.gamesError.message || state.gamesError)}</p></div>`;
    return;
  }
  if (!state.games) { view.innerHTML = `<div class="loading">Loading games…</div>`; return; }
  const favs = state.user.profile.favorites || [];
  const q = state.search.trim().toLowerCase();
  let list = state.games.filter((g) => !favOnly || favs.includes(g.id));
  if (state.category !== "all") list = list.filter((g) => (g.category || "other") === state.category);
  if (q) list = list.filter((g) => (g.title + " " + (g.description || "")).toLowerCase().includes(q));

  let empty = "";
  if (!list.length) {
    if (favOnly && !favs.length) empty = `<div class="empty"><div class="big">🤍</div><h2>No favorites yet</h2><p>Tap the heart on any game to save it here.</p></div>`;
    else if (!state.games.length) empty = `<div class="empty"><div class="big">🎮</div><h2>No games yet</h2><p>${state.user.isAdmin ? "Use “＋ Add game” to upload your first HTML game." : "Check back soon, games are on the way."}</p>${state.user.isAdmin ? `<p><button class="btn primary" id="emptyAdd">＋ Add game</button></p>` : ""}</div>`;
    else empty = `<div class="empty"><div class="big">🔍</div><h2>Nothing matches</h2><p>Try another search or category.</p></div>`;
  }

  // Keep the search box (and its focus) when re-rendering.
  const hadFocus = document.activeElement?.id === "search";
  view.innerHTML = `
    <div class="section-head">
      <h1>${title}</h1>
      <input id="search" class="search" type="search" placeholder="Search games…" value="${esc(state.search)}" aria-label="Search games" />
    </div>
    <div class="chips">${CATEGORIES.map((c) => `<button class="chip ${state.category === c ? "active" : ""}" data-cat="${c}">${c}</button>`).join("")}</div>
    ${empty || `<div class="grid">${list.map(gameCard).join("")}</div>`}`;
  const s = $("#search");
  s.oninput = () => { state.search = s.value; renderGames(favOnly); };
  if (hadFocus) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  view.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => { state.category = b.dataset.cat; renderGames(favOnly); }));
  $("#emptyAdd")?.addEventListener("click", () => openEditor(null));
}

async function renderLeaderboard() {
  view.innerHTML = `<div class="section-head"><h1>Leaderboard</h1></div><div class="loading">Loading…</div>`;
  try {
    const rows = await api.leaderboard();
    if (!location.hash.startsWith("#/leaderboard")) return;
    view.innerHTML = `
      <div class="section-head"><h1>Leaderboard</h1></div>
      <div class="board">
        ${rows.length ? rows.map((r, i) => `
          <div class="board-row ${r.uid === state.user.uid ? "me" : ""}">
            <span class="rank">${i + 1}</span>
            ${avatarHtml(r.displayName, r.photoURL)}
            <span class="board-name">${esc(r.displayName || "Player")}${r.uid === state.user.uid ? " (you)" : ""}</span>
            <span class="board-pts">⭐ ${(r.points || 0).toLocaleString()}</span>
          </div>`).join("") : `<div class="empty"><div class="big">🏆</div><h2>No players yet</h2></div>`}
      </div>
      <p class="board-note">Earn ${api.POINTS_PER_PLAY} points every time you start a game (once per minute).</p>`;
  } catch (e) {
    view.innerHTML = `<div class="empty"><div class="big">⚠️</div><h2>Couldn't load the leaderboard</h2><p>${esc(e.message)}</p></div>`;
  }
}

function route() {
  renderHeader();
  if (state.user === undefined) { view.innerHTML = `<div class="loading">Loading…</div>`; return; }
  if (!state.user) { renderSignedOut(); return; }
  const tab = (location.hash.replace(/^#\//, "") || "games").split("/")[0];
  if (tab === "favorites") renderGames(true);
  else if (tab === "leaderboard") renderLeaderboard();
  else renderGames(false);
}

async function loadGames() {
  state.gamesError = null;
  try { state.games = await api.listGames(); }
  catch (e) { state.gamesError = e; console.error(e); }
  route();
}

/* ---------- Card clicks ---------- */
view.addEventListener("click", async (e) => {
  const favBtn = e.target.closest("[data-fav]");
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");
  const card = e.target.closest(".card");
  if (favBtn) {
    e.stopPropagation();
    const id = favBtn.dataset.fav;
    const favs = state.user.profile.favorites || [];
    const on = !favs.includes(id);
    state.user.profile.favorites = on ? [...favs, id] : favs.filter((x) => x !== id);
    route();
    try { await api.setFavorite(state.user.uid, id, on); }
    catch (err) { toast("Couldn't save favorite"); state.user.profile.favorites = favs; route(); }
    return;
  }
  if (editBtn) { e.stopPropagation(); openEditor(state.games.find((g) => g.id === editBtn.dataset.edit)); return; }
  if (delBtn) { e.stopPropagation(); confirmDelete(state.games.find((g) => g.id === delBtn.dataset.del)); return; }
  if (card) playGame(state.games.find((g) => g.id === card.dataset.id));
});
view.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("card")) {
    e.preventDefault();
    playGame(state.games.find((g) => g.id === e.target.dataset.id));
  }
});

/* ---------- Player ---------- */
// Games run in a sandboxed frame (no access to this site's login). Sandboxed
// frames can't use localStorage, so give them an in-memory stand-in.
const STORAGE_SHIM = `<script>(function(){try{window.localStorage.getItem("_")}catch(e){var m=function(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}};try{Object.defineProperty(window,"localStorage",{value:m(),configurable:true});Object.defineProperty(window,"sessionStorage",{value:m(),configurable:true})}catch(_){}}})();<\/script>`;

function injectShim(html) {
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + STORAGE_SHIM);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => m + STORAGE_SHIM);
  if (/<!doctype[^>]*>/i.test(html)) return html.replace(/<!doctype[^>]*>/i, (m) => m + STORAGE_SHIM);
  return STORAGE_SHIM + html;
}

let playing = null;
async function playGame(g) {
  if (!g) return;
  playing = g.id;
  $("#playerTitle").textContent = g.title;
  $("#playerStatus").textContent = "";
  const wrap = $("#playerFrameWrap");
  wrap.innerHTML = `<div class="loading">Loading ${esc(g.title)}…</div>`;
  $("#player").hidden = false;
  document.body.style.overflow = "hidden";

  const frame = document.createElement("iframe");
  frame.title = g.title;
  frame.setAttribute("allow", "fullscreen; gamepad; autoplay; clipboard-write");
  frame.allowFullscreen = true;
  try {
    if (g.type === "url") {
      frame.src = g.url;
    } else {
      frame.setAttribute("sandbox", "allow-scripts allow-pointer-lock allow-popups allow-forms allow-modals allow-downloads");
      const html = await api.getGameHtml(g);
      if (playing !== g.id) return;
      frame.srcdoc = injectShim(html);
    }
  } catch (e) {
    wrap.innerHTML = `<div class="loading">Couldn't load this game: ${esc(e.message)}</div>`;
    return;
  }
  wrap.innerHTML = "";
  wrap.appendChild(frame);
  frame.focus();

  api.countPlay(g.id).then(() => { g.playCount = (g.playCount || 0) + 1; });
  if (Date.now() - state.lastPointsAt > api.PLAY_COOLDOWN_MS) {
    const ok = await api.awardPoints(state.user.uid);
    if (ok) {
      state.lastPointsAt = Date.now();
      state.user.profile.points = (state.user.profile.points || 0) + api.POINTS_PER_PLAY;
      updatePoints();
      if (playing === g.id) $("#playerStatus").textContent = `+${api.POINTS_PER_PLAY} ⭐`;
    }
  }
}

function closePlayer() {
  playing = null;
  $("#player").hidden = true;
  $("#playerFrameWrap").innerHTML = "";
  document.body.style.overflow = "";
  if (document.fullscreenElement) document.exitFullscreen?.();
  route();
}
$("#playerClose").onclick = closePlayer;
$("#playerFull").onclick = () => {
  const el = $("#playerFrameWrap");
  if (document.fullscreenElement) document.exitFullscreen();
  else el.requestFullscreen?.().catch(() => toast("Fullscreen isn't available here"));
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#player").hidden && !document.fullscreenElement && !$("#editor").open) closePlayer();
});

/* ---------- Admin editor ---------- */
const editor = $("#editor");
const form = $("#editorForm");
let editing = null;
let thumbData = "";
let fileHtml = "";

function setSource(src) {
  form.querySelectorAll("[name=source]").forEach((r) => (r.checked = r.value === src));
  form.querySelectorAll(".source-pane").forEach((p) => (p.hidden = p.dataset.source !== src));
}
form.querySelectorAll("[name=source]").forEach((r) => (r.onchange = () => setSource(r.value)));

function showThumb() {
  const p = $("#thumbPreview");
  p.hidden = !thumbData;
  p.innerHTML = thumbData ? `<img src="${esc(thumbData)}" alt="Thumbnail preview" /> <button type="button" class="btn ghost small" id="thumbRemove">Remove</button>` : "";
  $("#thumbRemove")?.addEventListener("click", () => { thumbData = ""; form.thumbFile.value = ""; showThumb(); });
}

function openEditor(game) {
  editing = game || null;
  thumbData = game?.thumbnail || "";
  fileHtml = "";
  form.reset();
  $("#editorError").hidden = true;
  $("#editorTitle").textContent = game ? "Edit game" : "Add game";
  $("#fileHint").textContent = game && game.type === "html"
    ? "Leave empty to keep the current game file, or choose a new one to replace it."
    : "Single-file HTML games work best (scripts and styles inside the file).";
  if (game) {
    form.title.value = game.title || "";
    form.description.value = game.description || "";
    form.category.value = game.category || "other";
    form.url.value = game.url || "";
  }
  setSource(game?.type === "url" ? "url" : "file");
  showThumb();
  $("#editorSave").disabled = false;
  $("#editorSave").textContent = "Save game";
  editor.showModal();
}
$("#editorClose").onclick = $("#editorCancel").onclick = () => editor.close();

form.thumbFile.onchange = async () => {
  const f = form.thumbFile.files[0];
  if (!f) return;
  try { thumbData = await resizeImage(f, 640, 360); showThumb(); }
  catch { toast("Couldn't read that image"); }
};
form.htmlFile.onchange = async () => {
  const f = form.htmlFile.files[0];
  fileHtml = f ? await f.text() : "";
  if (f && !form.title.value) form.title.value = f.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " ");
};

function resizeImage(file, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const err = $("#editorError");
  err.hidden = true;
  const source = form.querySelector("[name=source]:checked").value;
  const data = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    category: form.category.value,
    thumbnail: thumbData,
    type: source === "url" ? "url" : "html",
  };
  const fail = (m) => { err.textContent = m; err.hidden = false; };
  if (!data.title) return fail("Give the game a title.");
  if (source === "url") {
    data.url = form.url.value.trim();
    if (!/^https?:\/\//i.test(data.url)) return fail("Enter a full link starting with https://");
  } else {
    data.html = source === "paste" ? form.htmlCode.value : fileHtml;
    if (!data.html.trim()) {
      if (editing && editing.type === "html" && source === "file") {
        data.html = await api.getGameHtml(editing); // keep existing file
      } else {
        return fail(source === "paste" ? "Paste the game's HTML." : "Choose an .html file.");
      }
    }
  }
  const btn = $("#editorSave");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    await api.saveGame(editing?.id || null, data, (i, n) => { if (n > 1) btn.textContent = `Uploading ${i}/${n}…`; });
    editor.close();
    toast(editing ? "Game updated" : "Game added 🎉");
    await loadGames();
  } catch (e2) {
    console.error(e2);
    fail("Couldn't save: " + (e2.code === "permission-denied" ? "permission denied. Are the Firestore rules published?" : e2.message || e2));
    btn.disabled = false;
    btn.textContent = "Save game";
  }
};

/* ---------- Delete ---------- */
function confirmDelete(game) {
  if (!game) return;
  const dlg = $("#confirm");
  $("#confirmText").textContent = `Delete “${game.title}”? This removes it for everyone.`;
  dlg.returnValue = "";
  dlg.showModal();
  dlg.onclose = async () => {
    if (dlg.returnValue !== "yes") return;
    try {
      await api.deleteGame(game);
      toast("Game deleted");
      await loadGames();
    } catch (e) { toast("Couldn't delete: " + (e.code || e.message)); }
  };
}

/* ---------- Boot ---------- */
window.addEventListener("hashchange", route);
route();
api.onUser((u) => {
  state.user = u;
  state.games = null;
  route();
  if (u) loadGames();
});
