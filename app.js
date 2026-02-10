const players = [
  {
    name: "Aelar Dawnwhisper",
    classLevel: "High Elf Wizard (Level 5)",
    hook: "Arcane strategist focused on battlefield control and utility magic.",
    race: "High Elf",
    background: "Sage",
    stats: {
      STR: 8,
      DEX: 14,
      CON: 13,
      INT: 18,
      WIS: 12,
      CHA: 10
    },
    canDo: [
      "Recover spell slots on short rest (Arcane Recovery)",
      "Ritual cast known rituals without using spell slots",
      "Use Portent-style prep notes for planned encounters"
    ],
    cantDo: [
      "Cannot wear heavy armor effectively",
      "Low melee durability—avoid front line"
    ],
    inventory: [
      { name: "Spellbook", image: createItemIcon("📘", "#3b4c7a") },
      { name: "Arcane Crystal", image: createItemIcon("🔮", "#563f8f") },
      { name: "Mana Potion", image: createItemIcon("🧪", "#2f6d6a") },
      { name: "Traveler's Cloak", image: createItemIcon("🧥", "#5d4a3d") }
    ],
    spellWeb: {
      // NOTE FOR CUSTOMIZATION:
      // - `links` controls which nodes connect ("strings" in the web).
      // - Add/remove entries in `links` to decide exactly how many strings each node has.
      // - Example: { from: "spark", to: "arcane-burst" } attaches spark -> arcane-burst.
      // - Keep the top 4 nodes as "solo starters" (no incoming links) if you want them as base spells.
      // - `size` controls orb radius (bigger means more important).
      // - `unlocked: false` greys out a spell orb.
      nodes: [
        { id: "spark", label: "Spark", tier: 0, size: 22, unlocked: true },
        { id: "ward", label: "Ward", tier: 0, size: 20, unlocked: true },
        { id: "focus", label: "Focus", tier: 0, size: 20, unlocked: true },
        { id: "flare", label: "Flare", tier: 0, size: 20, unlocked: true },
        { id: "arcane-burst", label: "Arcane Burst", tier: 1, size: 24, unlocked: true },
        { id: "runic-step", label: "Runic Step", tier: 1, size: 20, unlocked: true },
        { id: "mirror-veil", label: "Mirror Veil", tier: 1, size: 20, unlocked: false },
        { id: "spell-chain", label: "Spell Chain", tier: 2, size: 24, unlocked: false },
        { id: "mana-weave", label: "Mana Weave", tier: 2, size: 22, unlocked: false },
        { id: "starfall", label: "Starfall", tier: 3, size: 28, unlocked: false }
      ],
      links: [
        { from: "spark", to: "arcane-burst" },
        { from: "ward", to: "runic-step" },
        { from: "focus", to: "mirror-veil" },
        { from: "flare", to: "arcane-burst" },
        { from: "arcane-burst", to: "spell-chain" },
        { from: "runic-step", to: "spell-chain" },
        { from: "runic-step", to: "mana-weave" },
        { from: "mirror-veil", to: "mana-weave" },
        { from: "spell-chain", to: "starfall" },
        { from: "mana-weave", to: "starfall" }
      ]
    }
  },
  {
    name: "Korga Stoneheart",
    classLevel: "Mountain Dwarf Cleric (Level 4)",
    hook: "Frontline support that keeps the party alive and stubborn.",
    race: "Mountain Dwarf",
    background: "Soldier",
    stats: {
      STR: 15,
      DEX: 10,
      CON: 16,
      INT: 9,
      WIS: 17,
      CHA: 11
    },
    canDo: [
      "Turn Undead in divine radius",
      "Channel Divinity to boost healing output",
      "Use medium/heavy armor and shield"
    ],
    cantDo: [
      "Limited ranged damage options",
      "Spell slots burn quickly in long dungeons"
    ],
    inventory: [
      { name: "Warhammer", image: createItemIcon("🔨", "#4a4f58") },
      { name: "Holy Symbol", image: createItemIcon("✶", "#6e5a2f") },
      { name: "Shield", image: createItemIcon("🛡", "#4e5f74") },
      { name: "Bandages", image: createItemIcon("🩹", "#7a5947") }
    ],
    spellWeb: {
      nodes: [
        { id: "prayer", label: "Prayer", tier: 0, size: 20, unlocked: true },
        { id: "light", label: "Light", tier: 0, size: 20, unlocked: true },
        { id: "vow", label: "Vow", tier: 0, size: 20, unlocked: true },
        { id: "grace", label: "Grace", tier: 0, size: 20, unlocked: true },
        { id: "healing-word", label: "Healing Word", tier: 1, size: 24, unlocked: true },
        { id: "bless", label: "Bless", tier: 1, size: 22, unlocked: true },
        { id: "warding-bond", label: "Warding Bond", tier: 2, size: 22, unlocked: false },
        { id: "spirit-weapon", label: "Spirit Weapon", tier: 2, size: 24, unlocked: false },
        { id: "divine-beacon", label: "Divine Beacon", tier: 3, size: 28, unlocked: false }
      ],
      links: [
        { from: "prayer", to: "healing-word" },
        { from: "light", to: "bless" },
        { from: "vow", to: "warding-bond" },
        { from: "grace", to: "healing-word" },
        { from: "healing-word", to: "warding-bond" },
        { from: "bless", to: "spirit-weapon" },
        { from: "warding-bond", to: "divine-beacon" },
        { from: "spirit-weapon", to: "divine-beacon" }
      ]
    }
  },
  {
    name: "Nyx Quickstep",
    classLevel: "Lightfoot Halfling Rogue (Level 5)",
    hook: "Scout and objective specialist with burst sneak damage.",
    race: "Lightfoot Halfling",
    background: "Criminal",
    stats: {
      STR: 9,
      DEX: 19,
      CON: 12,
      INT: 14,
      WIS: 13,
      CHA: 12
    },
    canDo: [
      "Cunning Action every turn",
      "Sneak Attack with advantage or ally adjacency",
      "Expertise in Stealth and Thieves' Tools"
    ],
    cantDo: [
      "No true spellcasting progression",
      "Vulnerable when cornered in melee"
    ],
    inventory: [
      { name: "Lockpicks", image: createItemIcon("🗝", "#545a63") },
      { name: "Smoke Bomb", image: createItemIcon("💨", "#4b4b56") },
      { name: "Dagger", image: createItemIcon("🗡", "#505866") },
      { name: "Map Fragments", image: createItemIcon("🗺", "#68583c") }
    ],
    spellWeb: {
      nodes: [
        { id: "step", label: "Step", tier: 0, size: 20, unlocked: true },
        { id: "mark", label: "Mark", tier: 0, size: 20, unlocked: true },
        { id: "fade", label: "Fade", tier: 0, size: 20, unlocked: true },
        { id: "scan", label: "Scan", tier: 0, size: 20, unlocked: true },
        { id: "shadow-hop", label: "Shadow Hop", tier: 1, size: 23, unlocked: true },
        { id: "weak-spot", label: "Weak Spot", tier: 1, size: 23, unlocked: true },
        { id: "silent-net", label: "Silent Net", tier: 2, size: 24, unlocked: false },
        { id: "finisher", label: "Finisher", tier: 3, size: 28, unlocked: false }
      ],
      links: [
        { from: "step", to: "shadow-hop" },
        { from: "mark", to: "weak-spot" },
        { from: "fade", to: "shadow-hop" },
        { from: "scan", to: "weak-spot" },
        { from: "shadow-hop", to: "silent-net" },
        { from: "weak-spot", to: "silent-net" },
        { from: "silent-net", to: "finisher" }
      ]
    }
  }
];

const grid = document.querySelector("#cardGrid");
const cardTemplate = document.querySelector("#cardTemplate");
const detailPanel = document.querySelector("#detailPanel");
const detailContent = document.querySelector("#detailContent");
const closeDetail = document.querySelector("#closeDetail");

let activeIndex = null;
let transitioning = false;

function renderCards() {
  players.forEach((player, index) => {
    player.index = index;
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".player-card");

    node.querySelector(".character-name").textContent = player.name;
    node.querySelector(".character-meta").textContent = player.classLevel;
    node.querySelector(".card-hook").textContent = player.hook;

    card.dataset.index = index;

    card.addEventListener("click", () => focusCard(index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusCard(index);
      }
    });

    grid.appendChild(node);
  });
}

function toList(items, className) {
  return `<ul class="${className}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

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

function layoutSpellWeb(spellWeb) {
  const width = 860;
  const height = 340;
  const tierGap = 95;

  const tiers = new Map();
  spellWeb.nodes.forEach((node) => {
    if (!tiers.has(node.tier)) tiers.set(node.tier, []);
    tiers.get(node.tier).push(node);
  });

  const positioned = new Map();
  [...tiers.keys()].sort((a, b) => a - b).forEach((tier) => {
    const nodes = tiers.get(tier);
    const rowY = 55 + tier * tierGap;
    const gap = width / (nodes.length + 1);

    nodes.forEach((node, idx) => {
      positioned.set(node.id, {
        ...node,
        x: Math.round((idx + 1) * gap),
        y: rowY
      });
    });
  });

  const linkSvg = spellWeb.links
    .map((link, index) => {
      const from = positioned.get(link.from);
      const to = positioned.get(link.to);
      if (!from || !to) return "";

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const drift = 9 + (index % 3) * 4;
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;

      const wisp1Cx = Math.round(midX + nx * drift);
      const wisp1Cy = Math.round(midY + ny * drift);
      const wisp2Cx = Math.round(midX - nx * (drift * 0.7));
      const wisp2Cy = Math.round(midY - ny * (drift * 0.7));

      return `
        <g class="web-link-group" style="--wisp-delay:${(index * 0.32).toFixed(2)}s">
          <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="web-link-main" />
          <path d="M ${from.x} ${from.y} Q ${wisp1Cx} ${wisp1Cy} ${to.x} ${to.y}" class="web-link-wisp wisp-a" />
          <path d="M ${from.x} ${from.y} Q ${wisp2Cx} ${wisp2Cy} ${to.x} ${to.y}" class="web-link-wisp wisp-b" />
        </g>`;
    })
    .join("");

  const nodeSvg = [...positioned.values()]
    .map((node) => {
      const radius = node.size ?? 20;
      const labelY = Math.min(5, Math.max(3, radius * 0.18));
      const stateClass = node.unlocked === false ? "locked" : "unlocked";
      return `
      <g class="web-node ${stateClass}" transform="translate(${node.x}, ${node.y})" tabindex="0" role="img" aria-label="${node.label} ${stateClass}">
        <circle r="${radius}"></circle>
        <text y="${labelY}" text-anchor="middle">${node.label}</text>
      </g>`;
    })
    .join("");

  return `
    <div class="spell-web-wrap">
      <svg viewBox="0 0 ${width} ${height}" class="spell-web" role="img" aria-label="Spell progression web">
        <defs>
          <linearGradient id="goldThread" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8b6427" />
            <stop offset="45%" stop-color="#d4ab57" />
            <stop offset="100%" stop-color="#f5dc9c" />
          </linearGradient>
          <filter id="threadGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g class="web-links">${linkSvg}</g>
        ${nodeSvg}
      </svg>
    </div>
    <p class="web-note">Edit <code>spellWeb.links</code> for node strings/connections, <code>size</code> for orb importance, and <code>unlocked</code> for locked/available state.</p>
  `;
}

function renderDetail(player) {
  const statsMarkup = Object.entries(player.stats)
    .map(([stat, value]) => `<li><strong>${stat}</strong>: ${value}</li>`)
    .join("");

  detailContent.innerHTML = `
    <header class="detail-header">
      <h2>${player.name}</h2>
      <p>${player.classLevel} • ${player.race} • ${player.background}</p>
    </header>

    <div class="detail-utilities">
      <a class="utility-tab inventory-link" href="inventory.html?player=${player.index}">Open Inventory</a>
      <a class="utility-tab inventory-link" href="spell.html?player=${player.index}">Open Spell Progression</a>
    </div>

    <div class="detail-grid">
      <section class="panel">
        <h3>Core Stats</h3>
        <ul class="stats-list">${statsMarkup}</ul>
      </section>

      <section class="panel">
        <h3>What You Can Do</h3>
        ${toList(player.canDo, "bullet-list")}
      </section>


      <section class="panel limits">
        <h3>Limits / Reminders</h3>
        ${toList(player.cantDo, "bullet-list")}

        <label class="notes-label" for="limitNotes">Custom Notes</label>
        <textarea id="limitNotes" class="notes-input" placeholder="Add your reminders here..."></textarea>
      </section>
    </div>

  `;


  const notesKey = `limits-notes-${player.index}`;
  const notesInput = detailContent.querySelector("#limitNotes");
  notesInput.value = localStorage.getItem(notesKey) ?? "";
  notesInput.addEventListener("input", () => {
    localStorage.setItem(notesKey, notesInput.value);
  });
}


function focusCard(index) {
  if (transitioning || activeIndex === index) {
    return;
  }

  transitioning = true;
  activeIndex = index;
  const cards = [...grid.querySelectorAll(".player-card")];

  cards.forEach((card) => {
    const isSelected = Number(card.dataset.index) === index;
    card.classList.toggle("selected", isSelected);

    if (!isSelected) {
      card.classList.add("fade-away");
    }
  });

  window.setTimeout(() => {
    cards.forEach((card) => {
      if (Number(card.dataset.index) !== index) {
        card.hidden = true;
      }
    });

    renderDetail(players[index]);
    detailPanel.hidden = false;
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    transitioning = false;
  }, 260);
}

function showAllCards() {
  if (transitioning) {
    return;
  }

  transitioning = true;
  detailPanel.hidden = true;
  detailContent.innerHTML = "";

  const cards = [...grid.querySelectorAll(".player-card")];
  cards.forEach((card) => {
    card.hidden = false;
    card.classList.remove("selected", "fade-away");
    card.classList.add("fade-in");
  });

  window.setTimeout(() => {
    cards.forEach((card) => card.classList.remove("fade-in"));
    activeIndex = null;
    transitioning = false;
  }, 260);
}

closeDetail.addEventListener("click", showAllCards);

renderCards();
