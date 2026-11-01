// Local, browser-only replacement for the Base44 backend.
// Every visitor gets their own data saved in localStorage, so the site
// runs as plain static files (e.g. on GitHub Pages) with no server.
import seed from "@/data/seed.json";

const PREFIX = "epic_ent_";
const memory = new Map();

function readKey(key) {
  try {
    const v = window.localStorage.getItem(PREFIX + key);
    if (v !== null) return JSON.parse(v);
  } catch {
    /* storage blocked: fall back to memory */
  }
  return memory.has(key) ? memory.get(key) : null;
}

function writeKey(key, value) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or blocked: memory copy still works this session */
  }
}

function removeKey(key) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

function sortRecords(records, sort) {
  if (!sort || typeof sort !== "string") return records;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    const r = av > bv ? 1 : -1;
    return desc ? -r : r;
  });
}

function matches(record, query) {
  if (!query) return true;
  return Object.entries(query).every(([k, v]) => {
    const rv = record[k];
    if (Array.isArray(rv) && !Array.isArray(v)) return rv.includes(v);
    return rv === v;
  });
}

// Built-in content shipped with the site (data/seed.json). Seed records are
// added for every visitor; ones a visitor deletes stay deleted for them.
function loadCollection(name) {
  let rows = readKey("entity_" + name);
  const seeded = readKey("seeded_" + name) || [];
  const seedRows = seed[name] || [];
  let changed = false;
  if (!rows) {
    rows = [];
    changed = true;
  }
  const seededSet = new Set(seeded);
  for (const s of seedRows) {
    if (!seededSet.has(s.id)) {
      if (!rows.some((r) => r.id === s.id)) {
        rows.push({ created_date: new Date(0).toISOString(), ...clone(s) });
      }
      seededSet.add(s.id);
      changed = true;
    }
  }
  if (changed) {
    writeKey("entity_" + name, rows);
    writeKey("seeded_" + name, [...seededSet]);
  }
  return rows;
}

function saveCollection(name, rows) {
  writeKey("entity_" + name, rows);
}

function makeEntity(name) {
  return {
    async list(sort, limit) {
      let rows = sortRecords(loadCollection(name), sort);
      if (limit) rows = rows.slice(0, limit);
      return clone(rows);
    },
    async filter(query, sort, limit) {
      let rows = loadCollection(name).filter((r) => matches(r, query));
      rows = sortRecords(rows, sort);
      if (limit) rows = rows.slice(0, limit);
      return clone(rows);
    },
    async get(id) {
      const row = loadCollection(name).find((r) => r.id === id);
      if (!row) {
        const err = new Error(`${name} ${id} not found`);
        err.status = 404;
        throw err;
      }
      return clone(row);
    },
    async create(data) {
      const rows = loadCollection(name);
      const now = new Date().toISOString();
      const user = getUser();
      const row = {
        ...clone(data),
        id: uid(),
        created_date: now,
        updated_date: now,
        created_by: user.email,
      };
      rows.push(row);
      saveCollection(name, rows);
      return clone(row);
    },
    async bulkCreate(list) {
      const out = [];
      for (const d of list) out.push(await this.create(d));
      return out;
    },
    async update(id, data) {
      const rows = loadCollection(name);
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) {
        const err = new Error(`${name} ${id} not found`);
        err.status = 404;
        throw err;
      }
      rows[i] = { ...rows[i], ...clone(data), updated_date: new Date().toISOString() };
      saveCollection(name, rows);
      return clone(rows[i]);
    },
    async delete(id) {
      const rows = loadCollection(name).filter((r) => r.id !== id);
      saveCollection(name, rows);
      return { success: true };
    },
  };
}

const entityCache = {};
const entities = new Proxy(
  {},
  {
    get(_, name) {
      if (typeof name !== "string") return undefined;
      if (!entityCache[name]) entityCache[name] = makeEntity(name);
      return entityCache[name];
    },
  }
);

// One local "account" per browser. Players pick their display name in the
// account setup dialog; this is just the identity those records hang off.
function getUser() {
  let user = readKey("user");
  if (!user) {
    const id = "local_" + uid();
    user = {
      id,
      email: `${id}@player.local`,
      full_name: "Player",
      role: "user",
      created_date: new Date().toISOString(),
    };
    writeKey("user", user);
  }
  return user;
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const auth = {
  async isAuthenticated() {
    return true;
  },
  async me() {
    return clone(getUser());
  },
  async updateMe(data) {
    const user = { ...getUser(), ...clone(data) };
    writeKey("user", user);
    return clone(user);
  },
  // "Log out" wipes this browser's local save after confirming.
  logout() {
    if (
      typeof window !== "undefined" &&
      window.confirm("Log out and erase this browser's save data (points, items, profile)?")
    ) {
      try {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(PREFIX))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch {
        /* ignore */
      }
      memory.clear();
      window.location.hash = "#/";
      window.location.reload();
    }
  },
  redirectToLogin() {
    window.location.hash = "#/";
  },
  setToken() {},
  async loginViaEmailPassword() {
    return { user: getUser() };
  },
  async loginWithProvider() {
    window.location.hash = "#/";
  },
  async register() {
    return { user: getUser() };
  },
  async verifyOtp() {
    return { user: getUser() };
  },
  async resendOtp() {},
  async resetPasswordRequest() {},
  async resetPassword() {},
};

export const db = {
  auth,
  entities,
  users: {
    async inviteUser() {
      return { success: true };
    },
  },
  integrations: {
    Core: {
      // No file server on a static site: files are stored inline as data URLs.
      async UploadFile({ file }) {
        return { file_url: await fileToDataUrl(file) };
      },
    },
  },
};

export const _removeKey = removeKey;

globalThis.__B44_DB__ = db;

export default db;
