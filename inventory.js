function createItemIcon(symbol, background) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="#1f2438"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="116" rx="16" fill="url(#bg)" stroke="#d7b77a" stroke-opacity="0.45"/>
      <text x="50%" y="57%" text-anchor="middle" font-size="46">${symbol}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const players = [
  {
    name: "Aelar Dawnwhisper",
    classLevel: "High Elf Wizard (Level 5)",
    armor: [
      { slot: "Head", item: "Mystic Hood", image: createItemIcon("🪖", "#4f5f8b") },
      { slot: "Chest", item: "Arcane Robe", image: createItemIcon("🥋", "#3f4d7a") },
      { slot: "Legs", item: "Runed Wraps", image: createItemIcon("👖", "#4a4f70") },
      { slot: "Boots", item: "Feather Boots", image: createItemIcon("🥾", "#5e5a73") },
      { slot: "Offhand", item: "Spell Focus", image: createItemIcon("🧿", "#5d4a89") }
    ],
    inventory: [
      { name: "Spellbook", image: createItemIcon("📘", "#3b4c7a") },
      { name: "Arcane Crystal", image: createItemIcon("🔮", "#563f8f") },
      { name: "Mana Potion", image: createItemIcon("🧪", "#2f6d6a") },
      { name: "Traveler's Cloak", image: createItemIcon("🧥", "#5d4a3d") }
    ]
  },
  {
    name: "Korga Stoneheart",
    classLevel: "Mountain Dwarf Cleric (Level 4)",
    armor: [
      { slot: "Head", item: "Iron Helm", image: createItemIcon("⛑", "#59616e") },
      { slot: "Chest", item: "Chain Mail", image: createItemIcon("🛡", "#505c70") },
      { slot: "Legs", item: "Greaves", image: createItemIcon("🦿", "#555d69") },
      { slot: "Boots", item: "Steel Boots", image: createItemIcon("🥾", "#6a635e") },
      { slot: "Offhand", item: "Ward Charm", image: createItemIcon("✶", "#6e5a2f") }
    ],
    inventory: [
      { name: "Warhammer", image: createItemIcon("🔨", "#4a4f58") },
      { name: "Holy Symbol", image: createItemIcon("✶", "#6e5a2f") },
      { name: "Shield", image: createItemIcon("🛡", "#4e5f74") },
      { name: "Bandages", image: createItemIcon("🩹", "#7a5947") }
    ]
  },
  {
    name: "Nyx Quickstep",
    classLevel: "Lightfoot Halfling Rogue (Level 5)",
    armor: [
      { slot: "Head", item: "Shadow Cowl", image: createItemIcon("🧢", "#505561") },
      { slot: "Chest", item: "Leather Jerkin", image: createItemIcon("🦺", "#5f584f") },
      { slot: "Legs", item: "Silent Leggings", image: createItemIcon("👖", "#4d5561") },
      { slot: "Boots", item: "Softstep Boots", image: createItemIcon("🥾", "#665c51") },
      { slot: "Offhand", item: "Throwing Knife", image: createItemIcon("🗡", "#505866") }
    ],
    inventory: [
      { name: "Lockpicks", image: createItemIcon("🗝", "#545a63") },
      { name: "Smoke Bomb", image: createItemIcon("💨", "#4b4b56") },
      { name: "Dagger", image: createItemIcon("🗡", "#505866") },
      { name: "Map Fragments", image: createItemIcon("🗺", "#68583c") }
    ]
  }
];

const params = new URLSearchParams(window.location.search);
const playerIndex = Number(params.get("player") ?? 0);
const player = players[playerIndex] ?? players[0];

document.querySelector("#inventoryName").textContent = `${player.name} — Inventory`;
document.querySelector("#inventoryMeta").textContent = player.classLevel;

const armorGrid = document.querySelector("#armorGrid");
armorGrid.innerHTML = player.armor
  .map(
    (piece) => `
      <article class="inventory-item armor-item" title="${piece.slot}: ${piece.item}">
        <img src="${piece.image}" alt="${piece.item}" loading="lazy" />
      </article>`
  )
  .join("");

const INVENTORY_COLUMNS = 5;
const INVENTORY_ROWS = 7;
const totalSlots = INVENTORY_COLUMNS * INVENTORY_ROWS;
const slots = [...player.inventory];
while (slots.length < totalSlots) {
  slots.push(null);
}

const inventoryGrid = document.querySelector("#inventoryGrid");
inventoryGrid.innerHTML = slots
  .map((item) => {
    if (!item) {
      return '<article class="inventory-item inventory-empty" aria-hidden="true"></article>';
    }

    return `
      <article class="inventory-item" title="${item.name}">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </article>`;
  })
  .join("");
