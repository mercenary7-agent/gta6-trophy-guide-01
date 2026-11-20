/* Leonida Legend — offline GTA VI PS5 trophy guide & tracker.
   Vanilla ES module, no dependencies, no network: data comes from data/trophies.json
   and progress lives in localStorage. */
/* Witnessed edit (session 218): comment-only change, no behavior change. */
// Built by an AI agent (Hermes) for make.fun gta6-trophy-guide-01; original code, MIT.

const STORE_KEY = "leonida-legend-progress-v1";
const SPOILER_KEY = "leonida-legend-spoiler-v1";

const listPane = document.getElementById("list-pane");
const detailPane = document.getElementById("detail");
const detailEmpty = document.getElementById("detail-empty");
const searchEl = document.getElementById("search");
const kindEl = document.getElementById("kind-filter");
const gradeEl = document.getElementById("grade-filter");
const spoilerEl = document.getElementById("spoiler");
const roadmapBtn = document.getElementById("roadmap-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");
const progressText = document.getElementById("progress-text");
const progressPct = document.getElementById("progress-pct");
const progressFill = document.getElementById("progress-fill");

let trophies = [];
let earned = loadEarned();
let spoiler = localStorage.getItem(SPOILER_KEY) === "1";
let showRoadmap = false;
let selectedId = null;

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}

function isEarned(t) { return earned.has(t.id); }

function gradeClass(g) { return "grade-" + g; }

function spoilerHides(t) {
  return spoiler && t.kind === "story" && !isEarned(t);
}

function displayName(t) { return spoilerHides(t) ? "Undiscovered story trophy" : t.name; }
function displayDesc(t) { return spoilerHides(t) ? "Hidden until earned (spoiler-free mode)." : t.description; }

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  return trophies.filter((t) => {
    if (kind === "missable" && !t.missable) return false;
    if (kind !== "missable" && kind !== "all" && t.kind !== kind) return false;
    if (grade !== "all" && t.grade !== grade) return false;
    if (q && !(t.name + " " + t.description + " " + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const n = trophies.length || 55;
  const done = trophies.filter(isEarned).length;
  const pct = n ? Math.round((done / n) * 100) : 0;
  progressText.textContent = done + " / " + n + " earned";
  progressPct.textContent = pct + "%";
  progressFill.style.width = pct + "%";
}

function cardHtml(t) {
  const hidden = spoilerHides(t);
  const cls = ["card", isEarned(t) ? "earned" : "", hidden ? "spoilered" : "", t.missable ? "missable" : ""].join(" ");
  const badge = t.missable ? '<span class="flag flag-missable">missable</span>' : "";
  return '<button type="button" class="' + cls + '" data-id="' + t.id + '">' +
    '<span class="check">' + (isEarned(t) ? "&#10003;" : "") + "</span>" +
    '<span class="card-main"><span class="card-name">' + esc(displayName(t)) + "</span>" +
    '<span class="card-desc">' + esc(displayDesc(t)) + "</span></span>" +
    '<span class="' + gradeClass(t.grade) + '">' + t.grade + "</span>" + badge +
    "</button>";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderList() {
  const items = filtered();
  const counts = { all: trophies.length };
  listPane.innerHTML = items.length
    ? items.map(cardHtml).join("")
    : '<p class="empty">No trophies match the current filters.</p>';
  listPane.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => selectTrophy(Number(el.dataset.id)));
  });
  renderProgress();
}

function renderRoadmap() {
  const order = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Finale", "Post-game", "Platinum (earn last)"];
  const groups = order.map((stage) => ({ stage, items: trophies.filter((t) => t.roadmapStage === stage) })).filter((g) => g.items.length);
  listPane.innerHTML = groups.map((g) =>
    '<div class="roadmap-stage"><h3>' + esc(g.stage) + ' <span class="stage-count">' + g.items.filter(isEarned).length + "/" + g.items.length + "</span></h3>" +
    g.items.map(cardHtml).join("") + "</div>"
  ).join("");
  listPane.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => { showRoadmap = false; roadmapBtn.textContent = "Roadmap"; selectTrophy(Number(el.dataset.id)); });
  });
  renderProgress();
}

function renderDetail(t) {
  detailEmpty.hidden = true;
  detailPane.hidden = false;
  const srcs = (t.sources || []).map((s) => "<li>" + esc(s) + "</li>").join("");
  detailPane.innerHTML =
    '<div class="detail-head">' +
    '<span class="' + gradeClass(t.grade) + ' big">' + t.grade + "</span>" +
    (t.missable ? '<span class="flag flag-missable">missable</span>' : "") +
    '<span class="flag">' + esc(t.kind) + "</span>" +
    '<span class="flag">' + esc(t.roadmapStage) + "</span>" +
    "</div>" +
    "<h2>" + esc(displayName(t)) + "</h2>" +
    '<p class="official">' + esc(displayDesc(t)) + "</p>" +
    '<label class="earned-toggle"><input type="checkbox" id="earned-box"' + (isEarned(t) ? " checked" : "") + "> Earned</label>" +
    "<h3>Guide</h3>" +
    '<p class="guide">' + esc(t.guide) + "</p>" +
    "<h3>Sources</h3>" +
    '<ul class="sources">' + srcs + "</ul>";
  document.getElementById("earned-box").addEventListener("change", (e) => {
    if (e.target.checked) earned.add(t.id); else earned.delete(t.id);
    saveEarned();
    if (showRoadmap) renderRoadmap(); else renderList();
    renderDetail(t);
  });
}

function selectTrophy(id) {
  selectedId = id;
  const t = trophies.find((x) => x.id === id);
  if (t) renderDetail(t);
  listPane.querySelectorAll(".card").forEach((el) => el.classList.toggle("selected", Number(el.dataset.id) === id));
}

function exportProgress() {
  const data = { app: "leonida-legend", version: 1, exportedAt: new Date().toISOString(), earned: [...earned] };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const arr = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(arr)) throw new Error("bad file");
      earned = new Set(arr.map(Number).filter((n) => trophies.some((t) => t.id === n)));
      saveEarned();
      if (showRoadmap) renderRoadmap(); else renderList();
      if (selectedId) selectTrophy(selectedId);
    } catch (err) {
      alert("Could not import progress: " + err.message);
    }
  };
  reader.readAsText(file);
}

async function init() {
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies || data;
  spoilerEl.checked = spoiler;
  searchEl.addEventListener("input", () => (showRoadmap ? renderRoadmap() : renderList()));
  kindEl.addEventListener("change", () => (showRoadmap ? renderRoadmap() : renderList()));
  gradeEl.addEventListener("change", () => (showRoadmap ? renderRoadmap() : renderList()));
  spoilerEl.addEventListener("change", () => {
    spoiler = spoilerEl.checked;
    localStorage.setItem(SPOILER_KEY, spoiler ? "1" : "0");
    if (showRoadmap) renderRoadmap(); else renderList();
    if (selectedId) selectTrophy(selectedId);
  });
  roadmapBtn.addEventListener("click", () => {
    showRoadmap = !showRoadmap;
    roadmapBtn.textContent = showRoadmap ? "Checklist" : "Roadmap";
    if (showRoadmap) renderRoadmap(); else renderList();
  });
  exportBtn.addEventListener("click", exportProgress);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    if (importFile.files[0]) importProgress(importFile.files[0]);
    importFile.value = "";
  });
  renderList();
}

init();
