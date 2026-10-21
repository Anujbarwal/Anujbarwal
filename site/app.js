const storageKey = "anuj-roadmap-progress-v1";
const courseDeadlineKey = "anuj-roadmap-course-deadline-v1";
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
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);
  const clock = document.querySelector("#local-time");
  clock.dateTime = now.toISOString();
  clock.textContent = `Your local time · ${time}`;
}

function createCourseDeadline(startDate) {
  const deadline = new Date(startDate);
  const dayOfMonth = deadline.getDate();
  deadline.setDate(1);
  deadline.setMonth(deadline.getMonth() + 18);
  const lastDayOfMonth = new Date(deadline.getFullYear(), deadline.getMonth() + 1, 0).getDate();
  deadline.setDate(Math.min(dayOfMonth, lastDayOfMonth));
  return deadline;
}

let courseDeadlineIsPersisted = true;

function getCourseDeadline() {
  try {
    const savedDeadline = localStorage.getItem(courseDeadlineKey);
    if (savedDeadline) {
      const parsedDeadline = new Date(savedDeadline);
      if (Number.isFinite(parsedDeadline.getTime())) return parsedDeadline;
    }

    const deadline = createCourseDeadline(new Date());
    localStorage.setItem(courseDeadlineKey, deadline.toISOString());
    return deadline;
  } catch {
    courseDeadlineIsPersisted = false;
    return createCourseDeadline(new Date());
  }
}

const courseDeadline = getCourseDeadline();
const countdownParts = {
  days: document.querySelector("#course-days"),
  hours: document.querySelector("#course-hours"),
  minutes: document.querySelector("#course-minutes"),
  seconds: document.querySelector("#course-seconds"),
};
const courseDeadlineLabel = document.querySelector("#course-timer-deadline");
courseDeadlineLabel.textContent =
  `Your 18-month target · ${new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(courseDeadline)}` +
  (courseDeadlineIsPersisted ? " · saved in this browser" : " · browser storage unavailable; timer lasts for this visit");

function updateCourseCountdown() {
  const remainingSeconds = Math.max(0, Math.floor((courseDeadline.getTime() - Date.now()) / 1_000));
  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;

  countdownParts.days.textContent = String(days);
  countdownParts.hours.textContent = String(hours).padStart(2, "0");
  countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
  countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
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
const heroCopy = document.querySelector(".hero-copy");
const sceneTrigger = document.querySelector("#scene-trigger");
const emojiScene = document.querySelector(".emoji-scene");
const heroKicker = document.querySelector("#hero-kicker");
const heroTitleFirst = document.querySelector("#hero-title-first");
const heroTitleSecond = document.querySelector("#hero-title-second");
const heroLede = document.querySelector("#hero-lede");
const heroQuote = document.querySelector("#hero-coding-quote");
const heroQuoteIndex = document.querySelector("#hero-quote-index");
const heroCoder = document.querySelector("#hero-coder");
const heroSceneCaption = document.querySelector("#hero-scene-caption");
const codingScenes = [
  {
    kicker: "A beginner's build-first roadmap",
    titleFirst: "From zero",
    titleSecond: "to full-stack.",
    lede: "A practical 12–18 month journey from my first HTML page to applications built, tested, and running on the internet.",
    quote: "Build small. Ship often.",
    coder: "👨‍💻",
    caption: "BUILDER MODE",
  },
  {
    kicker: "Debugging is part of the build",
    titleFirst: "Find the bug.",
    titleSecond: "Learn the fix.",
    lede: "Read the error, follow the clues, and turn every broken build into a lesson you can use.",
    quote: "Every bug leaves a clue.",
    coder: "👩‍💻",
    caption: "DEBUG MODE",
  },
  {
    kicker: "Turn curiosity into code",
    titleFirst: "Ideas become",
    titleSecond: "working apps.",
    lede: "Start with a small idea, shape it into a useful project, and bring it to life one feature at a time.",
    quote: "Make it work. Make it clear.",
    coder: "🤖",
    caption: "REFACTOR MODE",
  },
  {
    kicker: "Build a little every day",
    titleFirst: "Small steps.",
    titleSecond: "Real progress.",
    lede: "A steady learning path through web foundations, full-stack projects, testing, and deployment.",
    quote: "Consistency compiles.",
    coder: "🧑‍💻",
    caption: "FOCUS MODE",
  },
  {
    kicker: "Grow one skill at a time",
    titleFirst: "Make your next",
    titleSecond: "commit count.",
    lede: "Practice by making real things, then learn to explain how they work and what you would improve.",
    quote: "Learn it. Build it. Explain it.",
    coder: "🚀",
    caption: "SHIP MODE",
  },
];
let activeCodingScene = 0;

function showNextCodingScene() {
  activeCodingScene = (activeCodingScene + 1) % codingScenes.length;
  const scene = codingScenes[activeCodingScene];

  heroKicker.textContent = scene.kicker;
  heroTitleFirst.textContent = scene.titleFirst;
  heroTitleSecond.textContent = scene.titleSecond;
  heroLede.textContent = scene.lede;
  heroQuote.textContent = scene.quote;
  heroQuoteIndex.textContent = String(activeCodingScene + 1).padStart(2, "0");
  heroCoder.textContent = scene.coder;
  heroSceneCaption.textContent = `SCENE ${String(activeCodingScene + 1).padStart(2, "0")} · ${scene.caption}`;
  heroArt.dataset.scene = String(activeCodingScene % 3);
  heroCopy.classList.remove("is-changing");
  void heroCopy.offsetWidth;
  heroCopy.classList.add("is-changing");
  heroArt.classList.remove("is-changing");
  void heroArt.offsetWidth;
  heroArt.classList.add("is-changing");
}

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

sceneTrigger.addEventListener("click", showNextCodingScene);
window.setInterval(showNextCodingScene, 5_000);
updateProgress();
filterProjects();
updateLocalTime();
updateCourseCountdown();
window.setInterval(updateLocalTime, 1_000);
window.setInterval(updateCourseCountdown, 1_000);

const featuredQuote = document.querySelector("#featured-quote");
const quoteAuthor = document.querySelector("#quote-author");
const quoteSource = document.querySelector("#quote-source");
const quoteCount = document.querySelector("#quote-count");
const quoteCard = document.querySelector("#quote-card");
const quoteToggle = document.querySelector("#quote-toggle");
const computingQuotes = [
  {
    text: "The whole of arithmetic now appeared within the grasp of mechanism.",
    author: "Charles Babbage",
    source: "Passages from the Life of a Philosopher · 1864",
    url: "https://en.wikisource.org/wiki/Passages_from_the_Life_of_a_Philosopher/Chapter_VIII",
  },
  {
    text: "It can do whatever we know how to order it to perform.",
    author: "Ada Lovelace",
    source: "Notes by the Translator · 1843",
    url: "https://en.wikisource.org/wiki/Scientific_Memoirs/3/Sketch_of_the_Analytical_Engine_invented_by_Charles_Babbage,_Esq./Notes_by_the_Translator",
  },
  {
    text: "We may say most aptly that the Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.",
    author: "Ada Lovelace",
    source: "Notes by the Translator · 1843",
    url: "https://en.wikisource.org/wiki/Scientific_Memoirs/3/Sketch_of_the_Analytical_Engine_invented_by_Charles_Babbage,_Esq./Notes_by_the_Translator",
  },
  {
    text: "The science of operations, as derived from mathematics more especially, is a science of itself, and has its own abstract truth and value.",
    author: "Ada Lovelace",
    source: "Notes by the Translator · 1843",
    url: "https://en.wikisource.org/wiki/Scientific_Memoirs/3/Sketch_of_the_Analytical_Engine_invented_by_Charles_Babbage,_Esq./Notes_by_the_Translator",
  },
];
let activeQuoteIndex = 0;
let quoteRotationTimer;

function showNextComputingQuote() {
  activeQuoteIndex = (activeQuoteIndex + 1) % computingQuotes.length;
  const quote = computingQuotes[activeQuoteIndex];

  featuredQuote.textContent = quote.text;
  quoteAuthor.textContent = quote.author;
  quoteSource.textContent = quote.source;
  quoteSource.href = quote.url;
  quoteCount.textContent = `${String(activeQuoteIndex + 1).padStart(2, "0")} / ${String(computingQuotes.length).padStart(2, "0")}`;
  quoteCard.classList.remove("is-changing");
  void quoteCard.offsetWidth;
  quoteCard.classList.add("is-changing");
}

function startQuoteRotation() {
  quoteRotationTimer = window.setInterval(showNextComputingQuote, 5_000);
  quoteToggle.textContent = "Pause quotes";
  quoteToggle.setAttribute("aria-pressed", "false");
}

quoteToggle.addEventListener("click", () => {
  if (quoteRotationTimer) {
    window.clearInterval(quoteRotationTimer);
    quoteRotationTimer = undefined;
    quoteToggle.textContent = "Resume quotes";
    quoteToggle.setAttribute("aria-pressed", "true");
    return;
  }

  startQuoteRotation();
});
startQuoteRotation();
