const players = [
  {
    name: "Aelar Dawnwhisper",
    classLevel: "High Elf Wizard (Level 5)",
    spellWeb: {
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
    spellWeb: {
      nodes: [
        { id: "peek", label: "Peek", tier: 0, size: 18, unlocked: true },
        { id: "dash", label: "Dash", tier: 0, size: 20, unlocked: true },
        { id: "feint", label: "Feint", tier: 0, size: 20, unlocked: true },
        { id: "cloak", label: "Cloak", tier: 1, size: 22, unlocked: true },
        { id: "shadow-step", label: "Shadow Step", tier: 1, size: 22, unlocked: true },
        { id: "silent-blade", label: "Silent Blade", tier: 2, size: 24, unlocked: false },
        { id: "ghost-trail", label: "Ghost Trail", tier: 2, size: 20, unlocked: false },
        { id: "midnight-strike", label: "Midnight Strike", tier: 3, size: 28, unlocked: false }
      ],
      links: [
        { from: "peek", to: "cloak" },
        { from: "dash", to: "shadow-step" },
        { from: "feint", to: "shadow-step" },
        { from: "cloak", to: "silent-blade" },
        { from: "shadow-step", to: "silent-blade" },
        { from: "shadow-step", to: "ghost-trail" },
        { from: "silent-blade", to: "midnight-strike" },
        { from: "ghost-trail", to: "midnight-strike" }
      ]
    }
  }
];

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

const params = new URLSearchParams(window.location.search);
const playerIndex = Number(params.get("player") ?? 0);
const player = players[playerIndex] ?? players[0];

document.querySelector("#spellName").textContent = `${player.name} — Spell Progression`;
document.querySelector("#spellMeta").textContent = player.classLevel;
document.querySelector("#spellWebContent").innerHTML = layoutSpellWeb(player.spellWeb);

function enforceLandscape() {
  const isPhoneViewport = window.matchMedia("(max-width: 1024px)").matches;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  document.body.classList.toggle("lock-spell-view", isPhoneViewport && isPortrait);
}

window.addEventListener("resize", enforceLandscape);
window.addEventListener("orientationchange", enforceLandscape);
enforceLandscape();
