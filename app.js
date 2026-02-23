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
const tagStorageKey = "dnd-campaign-available-tags";
const defaultAvailableTags = [
  "Magic",
  "Magic dmg.",
  "Physical dmg.",
  "Heal",
  "Shield",
  "Buff",
  "Debuff",
  "Crowd Control",
  "AOE",
  "Single Target",
  "Mobility",
  "Summon"
];

const ABILITY_NAME_MAX_LENGTH = 32;

const AURA_BOUNDS_PADDING = 26;

const treeCanvas = document.querySelector("#treeCanvas");
const prereqSelect = document.querySelector("#abilityPrereq");
const abilityForm = document.querySelector("#abilityForm");
const resetTreeButton = document.querySelector("#resetTree");
const tabBar = document.querySelector("#tabBar");
const treeTitle = document.querySelector("#treeTitle");
const tagPicker = document.querySelector("#tagPicker");
const clearTagsButton = document.querySelector("#clearTags");
const editWebButton = document.querySelector("#editWebButton");
const filterWebButton = document.querySelector("#filterWebButton");
const filterPanel = document.querySelector("#filterPanel");
const filterModeSelect = document.querySelector("#filterMode");
const filterValueSelect = document.querySelector("#filterValue");
const clearFilterButton = document.querySelector("#clearFilter");
const editTabsButton = document.querySelector("#editTabsButton");
const confirmOverlay = document.querySelector("#confirmOverlay");
const confirmYesButton = document.querySelector("#confirmYes");
const confirmNoButton = document.querySelector("#confirmNo");
const confirmMessage = document.querySelector("#confirmMessage");
const spellInfoCard = document.querySelector("#spellInfoCard");
const doubleClickTooltip = document.querySelector("#doubleClickTooltip");
const abilityNameInput = document.querySelector("#abilityName");

let selectedFormTags = new Set();
let availableTags = [];
let isEditMode = false;
let isTabEditMode = false;
let selectedInfoNodeId = null;
let isFilterPanelOpen = false;
let activeFilterMode = "none";
let activeFilterValue = "";

const importanceToSize = {
  minor: 18,
  base: 22,
  major: 27,
  main: 32
};

function sizeFromImportance(importance) {
  return importanceToSize[importance] ?? importanceToSize.base;
}

function importanceFromSize(size) {
  const numericSize = Number(size);
  if (Number.isNaN(numericSize)) return "base";
  const entries = Object.entries(importanceToSize);
  let best = entries[0][0];
  let bestDiff = Number.POSITIVE_INFINITY;

  entries.forEach(([importance, mappedSize]) => {
    const diff = Math.abs(mappedSize - numericSize);
    if (diff < bestDiff) {
      best = importance;
      bestDiff = diff;
    }
  });

  return best;
}

function nodeRadius(node) {
  return Math.max(8, Number(node?.size) || 22);
}

function clampNodePositionToBounds(node, x, y) {
  const radius = nodeRadius(node) + AURA_BOUNDS_PADDING;
  return {
    x: Math.max(radius, Math.min(SVG_WIDTH - radius, Math.round(x))),
    y: Math.max(radius, Math.min(SVG_HEIGHT - radius, Math.round(y)))
  };
}

function nodeOverlapsAtPosition(nodeA, xA, yA, nodeB, xB = nodeB.x, yB = nodeB.y) {
  const minDistance = nodeRadius(nodeA) + nodeRadius(nodeB) + 4;
  return Math.hypot(xA - xB, yA - yB) < minDistance;
}

function overlapsAnyNode(tree, movingNode, x, y) {
  return tree.nodes.some((other) => other.id !== movingNode.id && nodeOverlapsAtPosition(movingNode, x, y, other));
}

function findNonOverlappingPosition(tree, movingNode, preferredX, preferredY) {
  const preferred = clampNodePositionToBounds(movingNode, preferredX, preferredY);
  if (!overlapsAnyNode(tree, movingNode, preferred.x, preferred.y)) {
    return preferred;
  }

  for (let radius = 18; radius <= 320; radius += 18) {
    for (let step = 0; step < 24; step += 1) {
      const angle = (Math.PI * 2 * step) / 24;
      const candidateX = preferred.x + Math.cos(angle) * radius;
      const candidateY = preferred.y + Math.sin(angle) * radius;
      const candidate = clampNodePositionToBounds(movingNode, candidateX, candidateY);
      if (!overlapsAnyNode(tree, movingNode, candidate.x, candidate.y)) {
        return candidate;
      }
    }
  }

  return preferred;
}

function loadAvailableTags() {
  const saved = localStorage.getItem(tagStorageKey);
  const base = [...defaultAvailableTags];
  if (!saved) return base;

  try {
    const parsed = JSON.parse(saved);
    const parsedTags = Array.isArray(parsed)
      ? parsed.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
    return parseTags([...base, ...parsedTags].join(","));
  } catch {
    return base;
  }
}

availableTags = loadAvailableTags();

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    node.importance = typeof node.importance === "string" ? node.importance : importanceFromSize(node.size);
    node.abilityKind = typeof node.abilityKind === "string" && node.abilityKind.trim() ? node.abilityKind.trim() : "Spell";
    node.spellDescription = typeof node.spellDescription === "string" ? node.spellDescription.trim() : "";
    node.abilityType = node.abilityType === "Unconventional" || node.abilityType === "Forbidden" ? node.abilityType : "Conventional";
    if (Number(node.tier) === 0) {
      node.unlocked = true;
    }

    const bounded = clampNodePositionToBounds(node, node.x, node.y);
    node.x = bounded.x;
    node.y = bounded.y;
  });

  tree.nodes.forEach((node) => {
    const adjusted = findNonOverlappingPosition(tree, node, node.x, node.y);
    node.x = adjusted.x;
    node.y = adjusted.y;
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
  localStorage.setItem(tagStorageKey, JSON.stringify(availableTags));
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

function nodeMatchesActiveFilter(node) {
  if (activeFilterMode === "none" || !activeFilterValue) return true;

  if (activeFilterMode === "descriptionType") {
    return (node.abilityKind ?? "Spell") === activeFilterValue;
  }

  if (activeFilterMode === "tag") {
    return Array.isArray(node.tags) && node.tags.some((tag) => tag.toLowerCase() === activeFilterValue.toLowerCase());
  }

  return true;
}

function getFilterValues(mode) {
  const tree = getActiveTree();
  if (!tree) return [];

  if (mode === "descriptionType") {
    return [...new Set(tree.nodes.map((node) => node.abilityKind || "Spell"))].sort((a, b) => a.localeCompare(b));
  }

  if (mode === "tag") {
    return [...new Set(tree.nodes.flatMap((node) => (Array.isArray(node.tags) ? node.tags : [])))].sort((a, b) => a.localeCompare(b));
  }

  return [];
}

function renderFilterPanel() {
  if (!filterPanel || !filterWebButton || !filterModeSelect || !filterValueSelect) return;

  filterPanel.hidden = !isFilterPanelOpen;
  filterWebButton.classList.toggle("is-active", isFilterPanelOpen);
  filterWebButton.setAttribute("aria-pressed", isFilterPanelOpen ? "true" : "false");

  filterModeSelect.value = activeFilterMode;
  const values = getFilterValues(activeFilterMode);
  const options = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");

  if (activeFilterMode === "none") {
    filterValueSelect.disabled = true;
    filterValueSelect.innerHTML = '<option value="">Select a filter</option>';
    activeFilterValue = "";
    return;
  }

  if (values.length === 0) {
    filterValueSelect.disabled = true;
    filterValueSelect.innerHTML = '<option value="">No values available</option>';
    activeFilterValue = "";
    return;
  }

  filterValueSelect.disabled = false;
  filterValueSelect.innerHTML = options;
  if (!values.includes(activeFilterValue)) {
    activeFilterValue = values[0];
  }
  filterValueSelect.value = activeFilterValue;
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
      const typeClass = node.abilityType === "Forbidden" ? "forbidden" : "";
      const filterClass = nodeMatchesActiveFilter(node) ? "" : "filtered-out";
      const handleRadius = isEditMode ? 4 : 2;
      const handles = node.attachments
        .map((point, index) => `<circle class="attach-handle" data-node-id="${node.id}" data-attachment-index="${index}" cx="${node.x + point.dx}" cy="${node.y + point.dy}" r="${handleRadius}"></circle>`)
        .join("");
      
      const deleteButton = isEditMode 
        ? `<button class="delete-orb-btn" data-node-id="${node.id}" aria-label="Delete ${escapeHtml(node.label)}">×</button>`
        : "";

      return `
      <g class="node-layer" data-node-id="${node.id}">
        <g class="node-core ${stateClass} ${typeClass} ${filterClass}" data-node-id="${node.id}" transform="translate(${node.x}, ${node.y})">
          <circle r="${node.size ?? 22}"></circle>
          <text y="4" text-anchor="middle">${escapeHtml(node.label)}</text>
          ${deleteButton}
        </g>
        <g class="attachment-layer">${handles}</g>
      </g>`;
    })
    .join("");

  const editClass = isEditMode ? "is-editing" : "";

  return `<div class="tree-wrap ${editClass}"><svg id="abilityTreeSvg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" class="tree" aria-label="Ability tech tree for ${treeTemplates[activeTab].label}">
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

function deleteNode(nodeId) {
  const tree = getActiveTree();
  const node = findNode(tree, nodeId);
  if (!node) return;

  // Remove all links to and from this node
  tree.links = tree.links.filter(link => link.from !== nodeId && link.to !== nodeId);

  // Remove the node
  const nodeIndex = tree.nodes.findIndex(n => n.id === nodeId);
  if (nodeIndex !== -1) {
    tree.nodes.splice(nodeIndex, 1);
  }

  saveState();
  renderAll();
}

function bindTreeDragHandlers() {
  const svg = document.querySelector("#abilityTreeSvg");
  if (!svg) return;

  svg.addEventListener("pointerdown", (event) => {
    if (!isEditMode) return;

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
      const tree = getActiveTree();
      const bounded = clampNodePositionToBounds(dragState.node, coords.x - dragState.offsetX, coords.y - dragState.offsetY);
      if (!overlapsAnyNode(tree, dragState.node, bounded.x, bounded.y)) {
        dragState.node.x = bounded.x;
        dragState.node.y = bounded.y;
        updateTreeSvgFromData();
      }
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

  svg.addEventListener("click", (event) => {
    if (isEditMode) {
      const deleteButton = event.target.closest(".delete-orb-btn");
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();
        const nodeId = deleteButton.dataset.nodeId;
        if (nodeId) {
          const tree = getActiveTree();
          const node = findNode(tree, nodeId);
          if (node) {
            const label = node.label || 'unnamed orb';
            requestPermanentConfirmation(`Delete "${label}"? This will remove the orb and all its connections.`).then(ok => {
              if (ok) {
                deleteNode(nodeId);
              }
            });
          }
        }
        return;
      }
    }
    
    const nodeCore = event.target.closest(".node-core");
    if (!nodeCore) return;

    const nodeId = nodeCore.dataset.nodeId;
    if (!nodeId) return;
    selectedInfoNodeId = nodeId;
    renderSpellInfoCard();
  });

  svg.addEventListener("dblclick", (event) => {
    if (!isEditMode) return;
    
    const nodeCore = event.target.closest(".node-core");
    if (!nodeCore) return;

    event.preventDefault();
    event.stopPropagation();

    const nodeId = nodeCore.dataset.nodeId;
    if (!nodeId) return;

    const tree = getActiveTree();
    const node = findNode(tree, nodeId);
    if (!node) return;

    const label = node.label || 'unnamed orb';
    requestPermanentConfirmation(`Delete "${label}"? This will remove the orb and all its connections.`).then(ok => {
      if (ok) {
        deleteNode(nodeId);
      }
    });
  });

  // Add hover functionality for tooltip in edit mode
  svg.addEventListener("mouseover", (event) => {
    if (!isEditMode) return;
    
    const nodeCore = event.target.closest(".node-core");
    if (!nodeCore) return;

    if (doubleClickTooltip) {
      doubleClickTooltip.hidden = false;
    }
  });

  svg.addEventListener("mouseout", (event) => {
    if (!isEditMode) return;
    
    const nodeCore = event.target.closest(".node-core");
    if (!nodeCore) return;

    if (doubleClickTooltip) {
      doubleClickTooltip.hidden = true;
    }
  });
}

function renderSpellInfoCard() {
  if (!spellInfoCard) return;

  if (isEditMode || !selectedInfoNodeId) {
    spellInfoCard.hidden = true;
    spellInfoCard.innerHTML = "";
    return;
  }

  const node = findNode(getActiveTree(), selectedInfoNodeId);
  if (!node) {
    spellInfoCard.hidden = true;
    spellInfoCard.innerHTML = "";
    return;
  }

  const tagsMarkup = Array.isArray(node.tags) && node.tags.length > 0
    ? node.tags.map((tag) => `<span class="ability-tag">${escapeHtml(tag)}</span>`).join("")
    : '<span class="tag-empty">No tags</span>';
  const spellDescription = node.spellDescription || "No spell description yet.";
  const damageDice = node.damageDice || "";

  spellInfoCard.innerHTML = `
    <div class="spell-info-header">
      <strong class="spell-info-name">${escapeHtml(node.label)}</strong>
      <button type="button" class="spell-info-close" aria-label="Close spell details">×</button>
    </div>
    <div class="spell-info-meta">Tier ${node.tier + 1}</div>
    <div class="spell-info-kind">${escapeHtml(node.abilityKind || "Spell")}</div>
    ${damageDice ? `<div class="spell-info-damage">Damage: ${escapeHtml(damageDice)}</div>` : ""}
    <p class="spell-info-description">${escapeHtml(spellDescription)}</p>
    <div class="spell-info-tags">
      <span class="tag-values">${tagsMarkup}</span>
    </div>
  `;
  spellInfoCard.hidden = false;

  const closeButton = spellInfoCard.querySelector(".spell-info-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      selectedInfoNodeId = null;
      renderSpellInfoCard();
    });
  }
}

function normalizeActiveTab() {
  if (treeTemplates[activeTab] && treesByTab[activeTab]) return;
  const firstTab = Object.keys(treeTemplates)[0];
  if (firstTab) {
    activeTab = firstTab;
    return;
  }

  treeTemplates.tank = {
    ...cloneTree(builtInTreeTemplates.tank),
    label: builtInTreeTemplates.tank.label
  };
  treesByTab.tank = cloneTree(builtInTreeTemplates.tank);
  normalizeTree(treesByTab.tank);
  activeTab = "tank";
}

function renderTagPicker() {
  const buttons = availableTags
    .map((tag) => {
      const activeClass = selectedFormTags.has(tag) ? "is-selected" : "";
      const pressed = selectedFormTags.has(tag) ? "true" : "false";
      return `<button type="button" class="tag-toggle ${activeClass}" data-tag="${tag}" aria-pressed="${pressed}">${tag}</button>`;
    })
    .join("");

  tagPicker.innerHTML = `${buttons}<button type="button" class="tag-toggle add-tag-btn" data-action="add-tag" aria-label="Add new tag">+</button>`;
}

function addTagOption() {
  const raw = window.prompt("New tag name");
  if (raw === null) return;

  const normalized = String(raw).trim();
  if (!normalized) return;

  const exists = availableTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase());
  if (!exists) {
    availableTags.push(normalized);
  }

  selectedFormTags.add(availableTags.find((tag) => tag.toLowerCase() === normalized.toLowerCase()) ?? normalized);
  saveState();
  renderTagPicker();
}

function renderPrereqOptions() {
  const selectedValues = Array.from(prereqSelect.selectedOptions ?? []).map((option) => option.value);
  const options = [];
  getActiveTree().nodes.forEach((node) => {
    options.push(`<option value="${node.id}">${node.label}</option>`);
  });
  prereqSelect.innerHTML = options.join("");

  selectedValues.forEach((value) => {
    const option = prereqSelect.querySelector(`option[value="${value}"]`);
    if (option) option.selected = true;
  });
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
      const editControls = isTabEditMode
        ? `<div class="tab-edit-actions">
            <button type="button" class="tab-mini-btn" data-rename-tab="${key}">Rename</button>
            <button type="button" class="tab-mini-btn danger" data-delete-tab="${key}">Delete</button>
          </div>`
        : "";

      return `<div class="tab-item">
        <button type="button" role="tab" class="tab-btn ${activeClass}" aria-selected="${selected}" data-tab="${key}">${template.label}</button>
        ${editControls}
      </div>`;
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

  tabBar.querySelectorAll(".tab-mini-btn[data-rename-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tabKey = button.dataset.renameTab;
      if (!tabKey || !treeTemplates[tabKey]) return;

      const nextLabel = window.prompt("Rename tab:", treeTemplates[tabKey].label);
      if (nextLabel === null) return;

      const trimmed = nextLabel.trim();
      if (!trimmed) return;
      treeTemplates[tabKey].label = trimmed;
      saveState();
      renderAll();
    });
  });

  tabBar.querySelectorAll(".tab-mini-btn[data-delete-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      const tabKey = button.dataset.deleteTab;
      if (!tabKey || !treeTemplates[tabKey]) return;
      if (Object.keys(treeTemplates).length <= 1) return;

      const ok = await requestPermanentConfirmation(`Delete tab "${treeTemplates[tabKey].label}"?`);
      if (!ok) return;

      delete treeTemplates[tabKey];
      delete treesByTab[tabKey];
      if (activeTab === tabKey) {
        activeTab = Object.keys(treeTemplates)[0] ?? "tank";
      }
      saveState();
      renderAll();
    });
  });
}

function suggestNodePosition(tree, tier) {
  const nodesInTier = tree.nodes.filter((node) => node.tier === tier).length;
  const rough = {
    x: Math.max(90, Math.min(810, 140 + nodesInTier * 120)),
    y: 52 + tier * 84
  };

  const probeNode = { id: "__probe__", size: 22 };
  return findNonOverlappingPosition(tree, probeNode, rough.x, rough.y);
}

function renderAll() {
  normalizeActiveTab();
  const tabLabel = treeTemplates[activeTab].label;
  treeTitle.textContent = `${tabLabel} Spells & Abilities`;
  treeCanvas.innerHTML = createTreeMarkup(getActiveTree());
  renderPrereqOptions();
  renderTabs();
  renderTagPicker();
  renderFilterPanel();
  bindTreeDragHandlers();
  renderSpellInfoCard();
}

function renderEditButton() {
  if (!editWebButton) return;
  editWebButton.textContent = isEditMode ? "Done" : "Edit";
  editWebButton.setAttribute("aria-pressed", isEditMode ? "true" : "false");
  editWebButton.classList.toggle("is-active", isEditMode);
}

function renderEditTabsButton() {
  if (!editTabsButton) return;
  editTabsButton.textContent = isTabEditMode ? "Done" : "Edit";
  editTabsButton.setAttribute("aria-pressed", isTabEditMode ? "true" : "false");
  editTabsButton.classList.toggle("is-active", isTabEditMode);
}

function requestPermanentConfirmation(message = "") {
  if (!confirmOverlay || !confirmYesButton || !confirmNoButton) return Promise.resolve(true);

  if (confirmMessage) {
    confirmMessage.textContent = String(message);
  }

  confirmOverlay.hidden = false;
  confirmYesButton.focus();

  return new Promise((resolve) => {
    const onYes = () => {
      cleanup();
      resolve(true);
    };
    const onNo = () => {
      cleanup();
      resolve(false);
    };
    const onOverlay = (event) => {
      if (event.target === confirmOverlay) onNo();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") onNo();
    };

    function cleanup() {
      confirmOverlay.hidden = true;
      confirmYesButton.removeEventListener("click", onYes);
      confirmNoButton.removeEventListener("click", onNo);
      confirmOverlay.removeEventListener("click", onOverlay);
      document.removeEventListener("keydown", onKeyDown);
    }

    confirmYesButton.addEventListener("click", onYes);
    confirmNoButton.addEventListener("click", onNo);
    confirmOverlay.addEventListener("click", onOverlay);
    document.addEventListener("keydown", onKeyDown);
  });
}

abilityForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(abilityForm);
  const label = String(formData.get("abilityName") ?? "").trim().slice(0, ABILITY_NAME_MAX_LENGTH);
  const tier = Number(formData.get("abilityTier") ?? 0);
  const importance = String(formData.get("abilityImportance") ?? "base");
  const abilityKindRaw = String(formData.get("abilityKind") ?? "Spell").trim();
  const abilityKind = abilityKindRaw || "Spell";
  const spellDescription = String(formData.get("abilitySpellDescription") ?? "").trim();
  const damageDice = String(formData.get("abilityDamageDice") ?? "").trim();
  const prereqs = Array.from(prereqSelect.selectedOptions ?? [])
    .map((option) => option.value)
    .filter(Boolean);
  const tags = [...selectedFormTags];
  const status = String(formData.get("abilityStatus") ?? "unlocked");
  const abilityType = String(formData.get("abilityType") ?? "Conventional");

  if (!label) return;
  if (prereqs.length < 1) {
    window.alert("Choose at least 1 prerequisite.");
    return;
  }

  const activeTree = getActiveTree();
  const baseId = toSlug(label);
  let id = baseId;
  let n = 2;
  while (activeTree.nodes.some((node) => node.id === id)) {
    id = `${baseId}-${n}`;
    n += 1;
  }

  const boundedTier = Number.isNaN(tier) ? 0 : Math.max(0, Math.min(4, tier));
  const boundedImportance = importanceToSize[importance] ? importance : "base";
  const boundedSize = sizeFromImportance(boundedImportance);
  const unlocked = boundedTier === 0 ? true : status === "unlocked";
  const roughPosition = suggestNodePosition(activeTree, boundedTier);
  const previewNode = { id, size: boundedSize };
  const position = findNonOverlappingPosition(activeTree, previewNode, roughPosition.x, roughPosition.y);

  activeTree.nodes.push({
    id,
    label,
    tier: boundedTier,
    size: boundedSize,
    importance: boundedImportance,
    abilityKind,
    spellDescription,
    damageDice,
    abilityType,
    unlocked,
    x: position.x,
    y: position.y,
    attachments: defaultAttachments(boundedSize),
    tags
  });

  prereqs.forEach((prereq) => {
    activeTree.links.push({ from: prereq, to: id });
  });

  saveState();
  abilityForm.reset();
  document.querySelector("#abilityImportance").value = "base";
  document.querySelector("#abilityKind").value = "Spell";
  document.querySelector("#abilitySpellDescription").value = "";
  document.querySelector("#abilityStatus").value = "unlocked";
  document.querySelector("#abilityType").value = "Conventional";
  selectedFormTags = new Set();
  renderAll();
});

tagPicker.addEventListener("click", (event) => {
  const addButton = event.target.closest(".add-tag-btn");
  if (addButton) {
    addTagOption();
    return;
  }

  const button = event.target.closest(".tag-toggle");
  if (!button) return;

  const tag = button.dataset.tag;
  if (!tag) return;

  if (selectedFormTags.has(tag)) {
    selectedFormTags.delete(tag);
  } else {
    selectedFormTags.add(tag);
  }

  renderTagPicker();
});

clearTagsButton.addEventListener("click", () => {
  selectedFormTags = new Set();
  renderTagPicker();
});


resetTreeButton.addEventListener("click", async () => {
  const ok = await requestPermanentConfirmation(`Reset "${treeTemplates[activeTab].label}" back to template values?`);
  if (!ok) return;
  treesByTab[activeTab] = cloneTree(treeTemplates[activeTab]);
  saveState();
  renderAll();
});

renderAll();
renderEditButton();
renderEditTabsButton();

if (abilityNameInput) {
  abilityNameInput.maxLength = ABILITY_NAME_MAX_LENGTH;
}

if (editWebButton) {
  editWebButton.addEventListener("click", () => {
    isEditMode = !isEditMode;
    if (isEditMode) {
      selectedInfoNodeId = null;
    }
    renderEditButton();
    renderAll();
  });
}

if (filterWebButton) {
  filterWebButton.addEventListener("click", () => {
    isFilterPanelOpen = !isFilterPanelOpen;
    renderFilterPanel();
  });
}

if (filterModeSelect) {
  filterModeSelect.addEventListener("change", () => {
    activeFilterMode = filterModeSelect.value;
    activeFilterValue = "";
    renderAll();
  });
}

if (filterValueSelect) {
  filterValueSelect.addEventListener("change", () => {
    activeFilterValue = filterValueSelect.value;
    renderAll();
  });
}

if (clearFilterButton) {
  clearFilterButton.addEventListener("click", () => {
    activeFilterMode = "none";
    activeFilterValue = "";
    renderAll();
  });
}

if (editTabsButton) {
  editTabsButton.addEventListener("click", () => {
    isTabEditMode = !isTabEditMode;
    renderEditTabsButton();
    renderAll();
  });
}
