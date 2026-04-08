const STORAGE_KEY = "legal-workflow-matters";

const STAGES = [
  "intake",
  "motion drafted",
  "motion sent",
  "motion filed",
  "order pending",
  "order signed",
  "follow-up due",
  "closed",
];

const stageSelect = document.querySelector('select[name="stage"]');
const matterForm = document.querySelector("#matter-form");
const openMattersContainer = document.querySelector("#open-matters");
const overdueContainer = document.querySelector("#overdue-followups");
const orderPendingContainer = document.querySelector("#order-pending");
const mattersByCourtContainer = document.querySelector("#matters-by-court");
const kpiContainer = document.querySelector("#kpis");
const cardTemplate = document.querySelector("#matter-card-template");

let matters = loadMatters();

initializeStageSelect(stageSelect);
matterForm.addEventListener("submit", handleMatterCreate);
render();

function initializeStageSelect(selectEl) {
  STAGES.forEach((stage) => {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    selectEl.append(option);
  });
}

function loadMatters() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveMatters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matters));
}

function handleMatterCreate(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const matter = {
    id: crypto.randomUUID(),
    clientName: formData.get("clientName")?.toString().trim(),
    fileNumber: formData.get("fileNumber")?.toString().trim(),
    court: formData.get("court")?.toString().trim(),
    county: formData.get("county")?.toString().trim(),
    caseNumber: formData.get("caseNumber")?.toString().trim(),
    judge: formData.get("judge")?.toString().trim(),
    status: formData.get("status")?.toString().trim(),
    stage: formData.get("stage")?.toString(),
    importantDate: formData.get("importantDate")?.toString(),
    reminders: [],
  };

  matters.unshift(matter);
  saveMatters();
  matterForm.reset();
  stageSelect.value = STAGES[0];
  render();
}

function render() {
  const openMatters = matters.filter((matter) => matter.stage !== "closed");
  const overdue = getOverdueMatters(openMatters);
  const waitingOnOrder = openMatters.filter((matter) => matter.stage === "order pending");

  renderKpis({
    openCount: openMatters.length,
    overdueCount: overdue.length,
    waitingOnOrderCount: waitingOnOrder.length,
    courtsCount: uniqueCourts(openMatters).length,
  });

  renderMatterList(openMattersContainer, openMatters);
  renderMatterList(overdueContainer, overdue);
  renderMatterList(orderPendingContainer, waitingOnOrder);
  renderMattersByCourt(openMatters);
}

function renderKpis(values) {
  const items = [
    ["Open Matters", values.openCount],
    ["Overdue Follow-Ups", values.overdueCount],
    ["Waiting on Signed Orders", values.waitingOnOrderCount],
    ["Active Courts", values.courtsCount],
  ];

  kpiContainer.innerHTML = "";
  items.forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "kpi-card";
    card.innerHTML = `<h3>${label}</h3><p>${value}</p>`;
    kpiContainer.append(card);
  });
}

function renderMatterList(container, list) {
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = '<p class="empty">No matters to show.</p>';
    return;
  }

  list.forEach((matter) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".matter-card");

    fragment.querySelector(".matter-title").textContent = `${matter.clientName} (${matter.fileNumber})`;
    fragment.querySelector(".matter-meta").textContent = `${matter.court} · ${matter.county} County · Case ${matter.caseNumber}`;

    const details = fragment.querySelector(".matter-details");
    details.append(
      detailRow("Judge", matter.judge),
      detailRow("Status", matter.status),
      detailRow("Important Date", formatDate(matter.importantDate))
    );

    const stageDropdown = fragment.querySelector(".stage-select");
    initializeStageSelect(stageDropdown);
    stageDropdown.value = matter.stage;
    stageDropdown.addEventListener("change", (event) => {
      updateMatter(matter.id, { stage: event.target.value });
    });

    fragment.querySelector(".stage-badge").textContent = matter.stage;

    const reminderList = fragment.querySelector(".reminder-list");
    renderReminders(reminderList, matter.reminders);

    fragment.querySelector(".reminder-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const reminder = {
        id: crypto.randomUUID(),
        note: formData.get("note")?.toString().trim(),
        dueDate: formData.get("dueDate")?.toString(),
        done: false,
      };

      updateMatter(matter.id, {
        reminders: [...matter.reminders, reminder],
      });
    });

    container.append(card);
  });
}

function renderReminders(container, reminders) {
  if (!reminders.length) {
    container.innerHTML = "<li>No reminders yet.</li>";
    return;
  }

  container.innerHTML = "";

  reminders.forEach((reminder) => {
    const item = document.createElement("li");
    const overdue = isPast(reminder.dueDate) ? "(Overdue)" : "";
    item.textContent = `${reminder.note} — ${formatDate(reminder.dueDate)} ${overdue}`;
    container.append(item);
  });
}

function renderMattersByCourt(openMatters) {
  const counts = openMatters.reduce((acc, matter) => {
    acc[matter.court] = (acc[matter.court] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    mattersByCourtContainer.innerHTML = '<p class="empty">No open matters yet.</p>';
    return;
  }

  const list = document.createElement("ul");
  entries.forEach(([court, count]) => {
    const item = document.createElement("li");
    item.textContent = `${court}: ${count}`;
    list.append(item);
  });

  mattersByCourtContainer.innerHTML = "";
  mattersByCourtContainer.append(list);
}

function updateMatter(id, updates) {
  matters = matters.map((matter) => (matter.id === id ? { ...matter, ...updates } : matter));
  saveMatters();
  render();
}

function getOverdueMatters(list) {
  return list.filter((matter) =>
    matter.reminders.some((reminder) => !reminder.done && isPast(reminder.dueDate))
  );
}

function uniqueCourts(list) {
  return [...new Set(list.map((matter) => matter.court))];
}

function isPast(dateString) {
  if (!dateString) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(dateString) {
  if (!dateString) return "N/A";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function detailRow(label, value) {
  const wrapper = document.createElement("div");
  const dt = document.createElement("dt");
  dt.textContent = `${label}:`;
  const dd = document.createElement("dd");
  dd.textContent = value;
  dd.style.margin = 0;

  wrapper.append(dt, dd);
  return wrapper;
}
