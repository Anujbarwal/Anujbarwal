const storageKey = "anuj-roadmap-progress-v1";
const milestoneInputs = [...document.querySelectorAll("[data-milestone]")];
const projectInputs = [...document.querySelectorAll("[data-project]")];
const roadmapCards = [...document.querySelectorAll(".roadmap-card")];
const projectCards = [...document.querySelectorAll(".project-card")];
const storageNote = document.querySelector(".storage-note");
const progressCount = document.querySelector("#progress-count");
const progressMessage = document.querySelector("#progress-message");
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const projectSearch = document.querySelector("#project-search");
const projectResults = document.querySelector("#project-results");
const emptyProjects = document.querySelector("#empty-projects");
let activeFilter = "all";
let storageAvailable = true;

const knownMilestones = new Set(milestoneInputs.map((input) => input.dataset.milestone));
const knownProjects = new Set(projectInputs.map((input) => input.dataset.project));

function readProgress() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { milestones: [], projects: [] };

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") throw new Error("Saved progress is not an object.");

    return {
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones.filter((id) => knownMilestones.has(id)) : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects.filter((id) => knownProjects.has(id)) : [],
    };
  } catch {
    storageAvailable = false;
    storageNote.textContent = "Browser storage is unavailable or unreadable; progress will not persist.";
    return { milestones: [], projects: [] };
  }
}

function saveProgress() {
  if (!storageAvailable) return;

  const state = {
    milestones: milestoneInputs.filter((input) => input.checked).map((input) => input.dataset.milestone),
    projects: projectInputs.filter((input) => input.checked).map((input) => input.dataset.project),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    storageAvailable = false;
    storageNote.textContent = "Browser storage is full or unavailable; changes will only last for this visit.";
  }
}

function updateProgress() {
  const complete = milestoneInputs.filter((input) => input.checked).length;
  const total = milestoneInputs.length;
  const percentage = total === 0 ? 0 : Math.round((complete / total) * 100);

  progressCount.textContent = `${complete} of ${total} milestones`;
  progressMessage.textContent = complete === 0
    ? "Your first step is ready when you are."
    : complete === total
      ? "A big journey, built one step at a time. Nice work."
      : "Every completed step is something you can build on.";
  progressBar.setAttribute("aria-valuenow", String(complete));
  progressFill.style.width = `${percentage}%`;

  milestoneInputs.forEach((input) => {
    input.closest(".roadmap-card").classList.toggle("is-complete", input.checked);
  });
  projectInputs.forEach((input) => {
    input.closest(".project-card").classList.toggle("is-complete", input.checked);
  });
}

function filterProjects() {
  const query = projectSearch.value.trim().toLowerCase();
  let visible = 0;

  projectCards.forEach((card) => {
    const matchesFilter = activeFilter === "all" || card.dataset.track === activeFilter;
    const matchesSearch = !query || `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(query);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  });

  projectResults.textContent = `Showing ${visible} of ${projectCards.length} projects`;
  emptyProjects.hidden = visible !== 0;
}

function updateLocalTime() {
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  document.querySelector("#local-time").textContent = `Your local time · ${time}`;
}

const savedProgress = readProgress();
milestoneInputs.forEach((input) => {
  input.checked = savedProgress.milestones.includes(input.dataset.milestone);
  input.addEventListener("change", () => {
    updateProgress();
    saveProgress();
  });
});
projectInputs.forEach((input) => {
  input.checked = savedProgress.projects.includes(input.dataset.project);
  input.addEventListener("change", () => {
    updateProgress();
    saveProgress();
  });
});

document.querySelector("#reset-progress").addEventListener("click", () => {
  const hasProgress = milestoneInputs.some((input) => input.checked) || projectInputs.some((input) => input.checked);
  if (!hasProgress) return;

  milestoneInputs.forEach((input) => { input.checked = false; });
  projectInputs.forEach((input) => { input.checked = false; });
  updateProgress();
  saveProgress();
  progressMessage.textContent = "Progress reset for this browser.";
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    filterProjects();
  });
});
projectSearch.addEventListener("input", filterProjects);

const heroArt = document.querySelector(".hero-art");
const emojiScene = document.querySelector(".emoji-scene");
heroArt.addEventListener("pointermove", (event) => {
  if (!event.isPrimary || event.pointerType === "touch") return;
  const bounds = heroArt.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  emojiScene.style.setProperty("--pointer-x", `${(x * 13).toFixed(1)}deg`);
  emojiScene.style.setProperty("--pointer-y", `${(y * -13).toFixed(1)}deg`);
});
heroArt.addEventListener("pointerleave", () => {
  emojiScene.style.setProperty("--pointer-x", "0deg");
  emojiScene.style.setProperty("--pointer-y", "0deg");
});

updateProgress();
filterProjects();
updateLocalTime();
window.setInterval(updateLocalTime, 60_000);
