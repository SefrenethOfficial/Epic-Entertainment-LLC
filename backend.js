// All Firebase access lives here, so the UI never talks to Firebase directly.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp, increment, arrayUnion, arrayRemove, Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const ADMIN_EMAIL = "epocendie@gmail.com";
export const POINTS_PER_PLAY = 10;
export const PLAY_COOLDOWN_MS = 60_000;
export const configured = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

// Firestore documents max out at 1 MiB, so game HTML is split across chunk docs.
const CHUNK_CHARS = 250_000;

let auth, fs;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  fs = getFirestore(app);
}

const isAdminUser = (u) => !!u && u.email === ADMIN_EMAIL && u.emailVerified;

async function ensureProfile(u) {
  const ref = doc(fs, "users", u.uid);
  const snap = await getDoc(ref);
  const name = (u.displayName || "Player").slice(0, 60);
  const photo = (u.photoURL || "").slice(0, 500);
  if (!snap.exists()) {
    const profile = {
      displayName: name, photoURL: photo, points: 0, favorites: [],
      lastPlayAt: Timestamp.fromMillis(0), createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { ...profile, lastPlayAt: Timestamp.fromMillis(0) };
  }
  const data = snap.data();
  if (data.displayName !== name || data.photoURL !== photo) {
    await updateDoc(ref, { displayName: name, photoURL: photo });
    data.displayName = name; data.photoURL = photo;
  }
  return data;
}

export function onUser(cb) {
  if (!configured) { cb(null); return; }
  onAuthStateChanged(auth, async (u) => {
    if (!u) return cb(null);
    try {
      const profile = await ensureProfile(u);
      cb({ uid: u.uid, email: u.email, displayName: profile.displayName, photoURL: profile.photoURL,
        isAdmin: isAdminUser(u), profile });
    } catch (e) {
      console.error(e);
      cb({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL,
        isAdmin: isAdminUser(u), profile: { points: 0, favorites: [] }, profileError: e });
    }
  });
}

export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signOut = () => fbSignOut(auth);

export async function listGames() {
  const snap = await getDocs(query(collection(fs, "games"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getGameHtml(game) {
  const parts = await Promise.all(
    Array.from({ length: game.chunkCount || 0 }, (_, i) => getDoc(doc(fs, "games", game.id, "chunks", String(i))))
  );
  return parts.map((s) => (s.exists() ? s.data().text : "")).join("");
}

// data: { title, description, category, thumbnail, type: 'html'|'url', html?, url? }
export async function saveGame(id, data, onProgress = () => {}) {
  const ref = id ? doc(fs, "games", id) : doc(collection(fs, "games"));
  const old = id ? (await getDoc(ref)).data() || {} : {};
  let chunkCount = 0;
  if (data.type === "html") {
    const html = data.html || "";
    chunkCount = Math.max(1, Math.ceil(html.length / CHUNK_CHARS));
    for (let i = 0; i < chunkCount; i++) {
      onProgress(i + 1, chunkCount);
      await setDoc(doc(fs, "games", ref.id, "chunks", String(i)), { text: html.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS) });
    }
  }
  for (let i = chunkCount; i < (old.chunkCount || 0); i++) {
    await deleteDoc(doc(fs, "games", ref.id, "chunks", String(i)));
  }
  const meta = {
    title: data.title, description: data.description || "", category: data.category || "other",
    thumbnail: data.thumbnail || "", type: data.type, url: data.type === "url" ? data.url : "",
    chunkCount, size: data.type === "html" ? (data.html || "").length : 0,
    playCount: old.playCount || 0, createdAt: old.createdAt || serverTimestamp(), updatedAt: serverTimestamp(),
  };
  await setDoc(ref, meta);
  return ref.id;
}

export async function deleteGame(game) {
  for (let i = 0; i < (game.chunkCount || 0); i++) {
    await deleteDoc(doc(fs, "games", game.id, "chunks", String(i)));
  }
  await deleteDoc(doc(fs, "games", game.id));
}

export async function countPlay(gameId) {
  try { await updateDoc(doc(fs, "games", gameId), { playCount: increment(1) }); } catch (e) { console.warn(e); }
}

// Returns true if points were awarded (rules enforce the cooldown server-side too).
export async function awardPoints(uid) {
  try {
    await updateDoc(doc(fs, "users", uid), { points: increment(POINTS_PER_PLAY), lastPlayAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.warn("No points this time:", e.code || e);
    return false;
  }
}

export async function setFavorite(uid, gameId, on) {
  await updateDoc(doc(fs, "users", uid), { favorites: on ? arrayUnion(gameId) : arrayRemove(gameId) });
}

export async function leaderboard() {
  const snap = await getDocs(query(collection(fs, "users"), orderBy("points", "desc"), limit(50)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
