export const RODS = [
  { id: "basic", name: "Basic Rod", emoji: "🎣", price: 0, currency: "points",
    zoneSize: 22, gravity: 0.9, fishSpeed: 2.5, pullForce: 1.2, fillRate: 1.6, drainRate: 1.3, rarityBoost: 0,
    desc: "A stick with string. Everyone starts here." },
  { id: "sturdy", name: "Sturdy Rod", emoji: "🎣", price: 800, currency: "points",
    zoneSize: 28, gravity: 0.75, fishSpeed: 2.0, pullForce: 1.4, fillRate: 2.0, drainRate: 1.0, rarityBoost: 15,
    desc: "Fiberglass build. Wider catch zone, steadier reel." },
  { id: "pro", name: "Pro Caster", emoji: "🎣", price: 60, currency: "diamonds",
    zoneSize: 34, gravity: 0.6, fishSpeed: 1.5, pullForce: 1.6, fillRate: 2.4, drainRate: 0.8, rarityBoost: 30,
    desc: "Professional grade. Attracts rare fish, smooth action." },
  { id: "golden", name: "Golden Rod", emoji: "🎣", price: 250, currency: "diamonds",
    zoneSize: 40, gravity: 0.5, fishSpeed: 1.0, pullForce: 1.8, fillRate: 3.0, drainRate: 0.5, rarityBoost: 55,
    desc: "Legendary craftsmanship. Fish practically jump in." },
];

export const FISH_TYPES = [
  { name: "Minnow", emoji: "🐟", rarity: "Common", fishPoints: 5, weight: 42 },
  { name: "Bass", emoji: "🐠", rarity: "Common", fishPoints: 10, weight: 28 },
  { name: "Salmon", emoji: "🐡", rarity: "Uncommon", fishPoints: 20, weight: 14 },
  { name: "Tropical Fish", emoji: "🐠", rarity: "Uncommon", fishPoints: 30, weight: 9 },
  { name: "Shark", emoji: "🦈", rarity: "Rare", fishPoints: 60, weight: 4 },
  { name: "Octopus", emoji: "🐙", rarity: "Rare", fishPoints: 75, weight: 2.5 },
  { name: "Whale", emoji: "🐋", rarity: "Legendary", fishPoints: 250, weight: 0.5 },
];

export const RARITY_COLORS = {
  Common: "text-muted-foreground",
  Uncommon: "text-green-400",
  Rare: "text-purple-400",
  Legendary: "text-yellow-400",
};

export function getRod(id) {
  return RODS.find(r => r.id === id) || RODS[0];
}

export function pickFish(rarityBoost = 0) {
  const adjusted = FISH_TYPES.map(f => {
    if (f.rarity === "Common") return { ...f, weight: f.weight * (1 - rarityBoost / 150) };
    return { ...f, weight: f.weight * (1 + rarityBoost / 100) };
  });
  const total = adjusted.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * total;
  for (const f of adjusted) { r -= f.weight; if (r <= 0) return f; }
  return adjusted[0];
}