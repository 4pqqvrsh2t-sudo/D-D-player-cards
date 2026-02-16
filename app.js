const builtInTreeTemplates = {
  tank: {
    label: "Tank",
    nodes: [
      { id: "brace", label: "Brace", tier: 0, size: 22, unlocked: true, x: 260, y: 72 },
      { id: "taunt", label: "Taunt", tier: 0, size: 20, unlocked: true, x: 520, y: 72 },
      { id: "fortify", label: "Fortify", tier: 1, size: 24, unlocked: true, x: 390, y: 156 },
      { id: "bulwark", label: "Bulwark", tier: 2, size: 24, unlocked: false, x: 390, y: 240 },
      { id: "immovable", label: "Immovable", tier: 3, size: 28, unlocked: false, x: 390, y: 324 }
    ],
    links: [
      { from: "brace", to: "fortify" },
      { from: "taunt", to: "fortify" },
      { from: "fortify", to: "bulwark" },
      { from: "bulwark", to: "immovable" }
    ]
  },
  longRange: {
    label: "Long Range",
    nodes: [
      { id: "focus-shot", label: "Focus Shot", tier: 0, size: 22, unlocked: true, x: 260, y: 72 },
      { id: "steady-aim", label: "Steady Aim", tier: 0, size: 20, unlocked: true, x: 520, y: 72 },
      { id: "piercing-bolt", label: "Piercing Bolt", tier: 1, size: 24, unlocked: true, x: 390, y: 156 },
      { id: "hawk-eye", label: "Hawk Eye", tier: 2, size: 22, unlocked: false, x: 390, y: 240 },
      { id: "meteor-volley", label: "Meteor Volley", tier: 3, size: 28, unlocked: false, x: 390, y: 324 }
    ],
    links: [
      { from: "focus-shot", to: "piercing-bolt" },
      { from: "steady-aim", to: "piercing-bolt" },
      { from: "piercing-bolt", to: "hawk-eye" },
      { from: "hawk-eye", to: "meteor-volley" }
    ]
  },
  support: {
    label: "Support",
    nodes: [
      { id: "mend", label: "Mend", tier: 0, size: 22, unlocked: true, x: 260, y: 72 },
      { id: "ward-song", label: "Ward Song", tier: 0, size: 20, unlocked: true, x: 520, y: 72 },
      { id: "blessing-wave", label: "Blessing Wave", tier: 1, size: 24, unlocked: true, x: 390, y: 156 },
      { id: "aegis-link", label: "Aegis Link", tier: 2, size: 22, unlocked: false, x: 390, y: 240 },
      { id: "divine-choir", label: "Divine Choir", tier: 3, size: 28, unlocked: false, x: 390, y: 324 }
    ],
    links: [
      { from: "mend", to: "blessing-wave" },
      { from: "ward-song", to: "blessing-wave" },
      { from: "blessing-wave", to: "aegis-link" },
      { from: "aegis-link", to: "divine-choir" }
    ]
  }
};

const SVG_WIDTH = 900;
const SVG_HEIGHT = 430;
const storageKey = "dnd-campaign-ability-trees-by-tab";
const templateStorageKey = "dnd-campaign-tab-templates";
const activeTabKeyStorage = "dnd-campaign-active-tab";

const treeCanvas = document.querySelector("#treeCanvas");
const abilityList = document.querySelector("#abilityList");
const prereqSelect = document.querySelector("#abilityPrereq");
const abilityForm = document.querySelector("#abilityForm");
const resetTreeButton = document.querySelector("#resetTree");
const tabBar = document.querySelector("#tabBar");
const treeTitle = document.querySelector("#treeTitle");
const listTitle = document.querySelector("#listTitle");

function attachmentRadius(nodeOrSize) {
  const size = typeof nodeOrSize === "number" ? nodeOrSize : (nodeOrSize?.size ?? 22);
  return Math.max(8, size + 1);
}

function clampAttachmentToOrb(node, dx, dy) {
  const radius = attachmentRadius(node);
  const length = Math.hypot(dx, dy) || 1;
  return {
    dx: Math.round((dx / length) * radius),
    dy: Math.round((dy / length) * radius)
  };
}

function defaultAttachments(size) {
  const radius = attachmentRadius(size);
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8;
    return {
      dx: Math.round(Math.cos(angle) * radius),
      dy: Math.round(Math.sin(angle) * radius)
    };
  });
}

function cloneTree(tree) {
  return {
    nodes: tree.nodes.map((node) => ({
      ...node,
      attachments: (node.attachments ?? defaultAttachments(node.size)).map((pt) => ({ ...pt }))
    })),
    links: tree.links.map((link) => ({ ...link }))
  };
}

function toSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "ability";
}

function parseTags(raw) {
  return String(raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index);
}

function tagsToDisplay(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return '<span class="tag-empty">No tags</span>';
  return tags.map((tag) => `<span class="ability-tag">${tag}</span>`).join("");
}

function loadTemplates() {
  const templates = Object.fromEntries(
    Object.entries(builtInTreeTemplates).map(([key, template]) => [key, cloneTree({ ...template })])
  );

  const saved = localStorage.getItem(templateStorageKey);
  if (!saved) return templates;

  try {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([key, template]) => {
      if (!template || typeof template.label !== "string") return;
      if (!Array.isArray(template.nodes) || template.nodes.length < 1) return;
      if (!Array.isArray(template.links)) return;
      templates[key] = cloneTree(template);
      templates[key].label = template.label;
    });
  } catch {
    return templates;
  }

  return templates;
}

let treeTemplates = loadTemplates();

function buildDefaultTreesFromTemplates() {
  return Object.fromEntries(Object.entries(treeTemplates).map(([key, template]) => [key, cloneTree(template)]));
}

function normalizeTree(tree) {
  tree.nodes.forEach((node) => {
    if (typeof node.x !== "number") node.x = Math.round(SVG_WIDTH / 2);
    if (typeof node.y !== "number") node.y = 52 + (node.tier ?? 0) * 84;
    if (!Array.isArray(node.attachments) || node.attachments.length !== 8) {
      node.attachments = defaultAttachments(node.size);
    } else {
      node.attachments = node.attachments.map((pt) => clampAttachmentToOrb(node, pt.dx ?? 0, pt.dy ?? 0));
    }
    node.tags = parseTags(Array.isArray(node.tags) ? node.tags.join(",") : "");
  });

  if (tree.nodes.length === 0) {
    tree.nodes.push({
      id: "core-ability",
      label: "Core Ability",
      tier: 0,
      size: 22,
      unlocked: true,
      x: 390,
      y: 156,
      attachments: defaultAttachments(22),
      tags: []
    });
  }
}

const savedTrees = localStorage.getItem(storageKey);
const treesByTab = savedTrees ? JSON.parse(savedTrees) : buildDefaultTreesFromTemplates();

Object.entries(treeTemplates).forEach(([key, template]) => {
  if (!treesByTab[key]) treesByTab[key] = cloneTree(template);
});
Object.values(treesByTab).forEach(normalizeTree);

let activeTab = localStorage.getItem(activeTabKeyStorage) || "tank";
if (!treeTemplates[activeTab]) {
  activeTab = Object.keys(treeTemplates)[0] ?? "tank";
}

let dragState = null;

function getActiveTree() {
  return treesByTab[activeTab];
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(treesByTab));
  localStorage.setItem(templateStorageKey, JSON.stringify(treeTemplates));
  localStorage.setItem(activeTabKeyStorage, activeTab);
}

function findNode(tree, nodeId) {
  return tree.nodes.find((node) => node.id === nodeId);
}

function attachmentPosition(node, index) {
  const point = node.attachments[index] ?? { dx: 0, dy: 0 };
  return { x: node.x + point.dx, y: node.y + point.dy };
}

function nearestAttachmentIndex(node, targetX, targetY) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < 8; i += 1) {
    const point = attachmentPosition(node, i);
    const distance = Math.hypot(point.x - targetX, point.y - targetY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function ensureLinkAttachmentIndices(tree) {
  tree.links.forEach((link) => {
    const fromNode = findNode(tree, link.from);
    const toNode = findNode(tree, link.to);
    if (!fromNode || !toNode) return;

    if (typeof link.fromAttachment !== "number") {
      link.fromAttachment = nearestAttachmentIndex(fromNode, toNode.x, toNode.y);
    }
    if (typeof link.toAttachment !== "number") {
      link.toAttachment = nearestAttachmentIndex(toNode, fromNode.x, fromNode.y);
    }
  });
}

function createTreeMarkup(tree) {
  ensureLinkAttachmentIndices(tree);

  const links = tree.links
    .map((link, index) => {
      const fromNode = findNode(tree, link.from);
      const toNode = findNode(tree, link.to);
      if (!fromNode || !toNode) return "";
      const fromPoint = attachmentPosition(fromNode, link.fromAttachment);
      const toPoint = attachmentPosition(toNode, link.toAttachment);
      return `<line data-link-index="${index}" x1="${fromPoint.x}" y1="${fromPoint.y}" x2="${toPoint.x}" y2="${toPoint.y}" class="web-link"/>`;
    })
    .join("");

  const nodes = tree.nodes
    .map((node) => {
      const stateClass = node.unlocked ? "on" : "off";
      const handles = node.attachments
        .map((point, index) => `<circle class="attach-handle" data-node-id="${node.id}" data-attachment-index="${index}" cx="${node.x + point.dx}" cy="${node.y + point.dy}" r="2"></circle>`)
        .join("");

      return `
      <g class="node-layer" data-node-id="${node.id}">
        <g class="node-core ${stateClass}" data-node-id="${node.id}" transform="translate(${node.x}, ${node.y})">
          <circle r="${node.size ?? 22}"></circle>
          <text y="4" text-anchor="middle">${node.label}</text>
        </g>
        <g class="attachment-layer">${handles}</g>
      </g>`;
    })
    .join("");

  return `<div class="tree-wrap"><svg id="abilityTreeSvg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" class="tree" aria-label="Ability tech tree for ${treeTemplates[activeTab].label}">
    <defs>
      <radialGradient id="orbUnlockedGradient" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#5f739c" />
        <stop offset="60%" stop-color="#344363" />
        <stop offset="100%" stop-color="#202a42" />
      </radialGradient>
      <radialGradient id="orbLockedGradient" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#656a77" />
        <stop offset="60%" stop-color="#464c57" />
        <stop offset="100%" stop-color="#353a44" />
      </radialGradient>
    </defs>
    <g class="link-layer">${links}</g>${nodes}</svg></div>`;
}

function updateTreeSvgFromData() {
  const tree = getActiveTree();
  const svg = document.querySelector("#abilityTreeSvg");
  if (!svg) return;

  tree.nodes.forEach((node) => {
    const core = svg.querySelector(`.node-core[data-node-id="${node.id}"]`);
    if (core) core.setAttribute("transform", `translate(${node.x}, ${node.y})`);

    node.attachments.forEach((point, index) => {
      const handle = svg.querySelector(`.attach-handle[data-node-id="${node.id}"][data-attachment-index="${index}"]`);
      if (!handle) return;
      handle.setAttribute("cx", String(node.x + point.dx));
      handle.setAttribute("cy", String(node.y + point.dy));
    });
  });

  tree.links.forEach((link, index) => {
    const line = svg.querySelector(`line[data-link-index="${index}"]`);
    const fromNode = findNode(tree, link.from);
    const toNode = findNode(tree, link.to);
    if (!line || !fromNode || !toNode) return;

    const fromPoint = attachmentPosition(fromNode, link.fromAttachment);
    const toPoint = attachmentPosition(toNode, link.toAttachment);
    line.setAttribute("x1", String(fromPoint.x));
    line.setAttribute("y1", String(fromPoint.y));
    line.setAttribute("x2", String(toPoint.x));
    line.setAttribute("y2", String(toPoint.y));
  });
}

function getSvgCoordinates(svg, clientX, clientY) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function bindTreeDragHandlers() {
  const svg = document.querySelector("#abilityTreeSvg");
  if (!svg) return;

  svg.addEventListener("pointerdown", (event) => {
    const nodeCore = event.target.closest(".node-core");
    const attachment = event.target.closest(".attach-handle");
    if (!nodeCore && !attachment) return;

    const tree = getActiveTree();
    const coords = getSvgCoordinates(svg, event.clientX, event.clientY);

    if (nodeCore) {
      const nodeId = nodeCore.dataset.nodeId;
      const node = findNode(tree, nodeId);
      if (!node) return;
      dragState = {
        mode: "node",
        node,
        offsetX: coords.x - node.x,
        offsetY: coords.y - node.y
      };
    }

    if (attachment) {
      const nodeId = attachment.dataset.nodeId;
      const attachmentIndex = Number(attachment.dataset.attachmentIndex);
      const node = findNode(tree, nodeId);
      if (!node || Number.isNaN(attachmentIndex)) return;
      dragState = {
        mode: "attachment",
        node,
        attachmentIndex
      };
    }

    if (dragState) {
      event.preventDefault();
      svg.setPointerCapture(event.pointerId);
    }
  });

  svg.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const coords = getSvgCoordinates(svg, event.clientX, event.clientY);

    if (dragState.mode === "node") {
      dragState.node.x = Math.max(20, Math.min(SVG_WIDTH - 20, Math.round(coords.x - dragState.offsetX)));
      dragState.node.y = Math.max(20, Math.min(SVG_HEIGHT - 20, Math.round(coords.y - dragState.offsetY)));
      updateTreeSvgFromData();
    }

    if (dragState.mode === "attachment") {
      const point = dragState.node.attachments[dragState.attachmentIndex];
      const clamped = clampAttachmentToOrb(dragState.node, coords.x - dragState.node.x, coords.y - dragState.node.y);
      point.dx = clamped.dx;
      point.dy = clamped.dy;
      updateTreeSvgFromData();
    }
  });

  function finishDrag() {
    if (!dragState) return;
    dragState = null;
    saveState();
  }

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
}

function renderAbilityList() {
  const rows = getActiveTree().nodes
    .slice()
    .sort((a, b) => a.tier - b.tier || a.label.localeCompare(b.label))
    .map(
      (node) => `
      <li class="ability-item" data-node-id="${node.id}">
        <div><strong>${node.label}</strong> — Tier ${node.tier + 1} • ${node.unlocked ? "Unlocked" : "Locked"}</div>
        <div class="ability-tags-row">
          <span class="tag-label">Tags:</span>
          <span class="tag-values">${tagsToDisplay(node.tags)}</span>
        </div>
        <button type="button" class="edit-tags-btn" data-node-id="${node.id}">Edit Tags</button>
      </li>`
    )
    .join("");

  abilityList.innerHTML = `<ul class="list">${rows}</ul>`;
}

function renderPrereqOptions() {
  const options = ['<option value="">None (starter ability)</option>'];
  getActiveTree().nodes.forEach((node) => {
    options.push(`<option value="${node.id}">${node.label}</option>`);
  });
  prereqSelect.innerHTML = options.join("");
}

function createNewTab() {
  const rawLabel = window.prompt("Name your new tab (example: Summoner)");
  if (rawLabel === null) return;

  const label = rawLabel.trim();
  if (!label) return;

  const baseKey = toSlug(label);
  let key = baseKey;
  let counter = 2;
  while (treeTemplates[key]) {
    key = `${baseKey}-${counter}`;
    counter += 1;
  }

  const template = {
    label,
    nodes: [
      {
        id: "core-ability",
        label: "Core Ability",
        tier: 0,
        size: 22,
        unlocked: true,
        x: 390,
        y: 156,
        attachments: defaultAttachments(22),
        tags: []
      }
    ],
    links: []
  };

  treeTemplates[key] = cloneTree(template);
  treesByTab[key] = cloneTree(template);
  activeTab = key;
  saveState();
  renderAll();
}

function renderTabs() {
  const roleButtons = Object.entries(treeTemplates)
    .map(([key, template]) => {
      const activeClass = key === activeTab ? "is-active" : "";
      const selected = key === activeTab ? "true" : "false";
      return `<button type="button" role="tab" class="tab-btn ${activeClass}" aria-selected="${selected}" data-tab="${key}">${template.label}</button>`;
    })
    .join("");

  tabBar.innerHTML = `${roleButtons}<button type="button" class="tab-btn add-tab-btn" aria-label="Add tab">+</button>`;

  tabBar.querySelectorAll(".tab-btn[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.tab;
      if (!nextTab || nextTab === activeTab) return;
      activeTab = nextTab;
      saveState();
      renderAll();
    });
  });

  const addTabButton = tabBar.querySelector(".add-tab-btn");
  if (addTabButton) {
    addTabButton.addEventListener("click", createNewTab);
  }
}

function suggestNodePosition(tree, tier) {
  const nodesInTier = tree.nodes.filter((node) => node.tier === tier).length;
  return {
    x: Math.max(90, Math.min(810, 140 + nodesInTier * 120)),
    y: 52 + tier * 84
  };
}

function renderAll() {
  const tabLabel = treeTemplates[activeTab].label;
  treeTitle.textContent = `${tabLabel} Ability Web`;
  listTitle.textContent = `${tabLabel} Abilities`;
  treeCanvas.innerHTML = createTreeMarkup(getActiveTree());
  renderAbilityList();
  renderPrereqOptions();
  renderTabs();
  bindTreeDragHandlers();
}

abilityForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(abilityForm);
  const label = String(formData.get("abilityName") ?? "").trim();
  const tier = Number(formData.get("abilityTier") ?? 0);
  const size = Number(formData.get("abilitySize") ?? 22);
  const prereq = String(formData.get("abilityPrereq") ?? "");
  const tags = parseTags(formData.get("abilityTags"));
  const unlocked = formData.get("abilityUnlocked") === "on";

  if (!label) return;

  const activeTree = getActiveTree();
  const baseId = toSlug(label);
  let id = baseId;
  let n = 2;
  while (activeTree.nodes.some((node) => node.id === id)) {
    id = `${baseId}-${n}`;
    n += 1;
  }

  const boundedTier = Number.isNaN(tier) ? 0 : Math.max(0, Math.min(4, tier));
  const boundedSize = Number.isNaN(size) ? 22 : Math.max(16, Math.min(32, size));
  const position = suggestNodePosition(activeTree, boundedTier);

  activeTree.nodes.push({
    id,
    label,
    tier: boundedTier,
    size: boundedSize,
    unlocked,
    x: position.x,
    y: position.y,
    attachments: defaultAttachments(boundedSize),
    tags
  });

  if (prereq) {
    activeTree.links.push({ from: prereq, to: id });
  }

  saveState();
  abilityForm.reset();
  document.querySelector("#abilitySize").value = "22";
  document.querySelector("#abilityUnlocked").checked = true;
  document.querySelector("#abilityTags").value = "";
  renderAll();
});


abilityList.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-tags-btn");
  if (!button) return;

  const nodeId = button.dataset.nodeId;
  const node = findNode(getActiveTree(), nodeId);
  if (!node) return;

  const current = Array.isArray(node.tags) ? node.tags.join(", ") : "";
  const next = window.prompt(`Edit tags for ${node.label} (comma separated):`, current);
  if (next === null) return;

  node.tags = parseTags(next);
  saveState();
  renderAbilityList();
});

resetTreeButton.addEventListener("click", () => {
  treesByTab[activeTab] = cloneTree(treeTemplates[activeTab]);
  saveState();
  renderAll();
});

renderAll();
