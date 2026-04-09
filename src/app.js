const STORAGE_KEY = "legal-workflow-matters-v2";
const STATUS_OPTIONS = ["open", "follow-up due", "order pending", "order signed", "closed"];

const appContainer = document.querySelector("#app");

let storageAvailable = true;
let matters = loadMatters();

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    window.location.hash = "#/matters";
  }
  renderRoute();
});

function loadMatters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    return JSON.parse(raw);
  } catch (error) {
    storageAvailable = false;
    console.warn("LocalStorage unavailable. Data will be kept only for this session.", error);
    return [];
  }
}

function saveMatters() {
  if (!storageAvailable) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matters));
  } catch (error) {
    storageAvailable = false;
    console.warn("Could not write to LocalStorage. Further changes are session-only.", error);
  }
}

function renderRoute() {
  const route = parseRoute(window.location.hash);

  if (route.page === "list") {
    renderMatterListPage();
    return;
  }

  if (route.page === "new") {
    renderMatterFormPage();
    return;
  }

  if (route.page === "detail") {
    const matter = matters.find((item) => item.id === route.id);
    if (!matter) {
      renderNotFound("Matter not found.");
      return;
    }
    renderMatterDetailPage(matter);
    return;
  }

  if (route.page === "edit") {
    const matter = matters.find((item) => item.id === route.id);
    if (!matter) {
      renderNotFound("Matter not found.");
      return;
    }
    renderMatterFormPage(matter);
    return;
  }

  renderNotFound("Page not found.");
}

function parseRoute(hash) {
  const normalized = (hash || "#/matters").replace(/^#/, "");
  const parts = normalized.split("/").filter(Boolean);

  if (parts[0] !== "matters") return { page: "not-found" };
  if (parts.length === 1) return { page: "list" };
  if (parts[1] === "new") return { page: "new" };
  if (parts.length === 2) return { page: "detail", id: parts[1] };
  if (parts.length === 3 && parts[2] === "edit") return { page: "edit", id: parts[1] };

  return { page: "not-found" };
}

function renderMatterListPage() {
  const openMatters = matters.filter((matter) => matter.status !== "closed");
  const overdueFollowups = openMatters.filter(isFollowupOverdue);
  const delayedOrders = openMatters.filter(isOrderDelayed);

  appContainer.innerHTML = `
    <section class="list-page">
      <div class="list-head">
        <h2>Matters</h2>
        <a class="button-link" href="#/matters/new">Create Matter</a>
      </div>

      <div class="kpi-grid">
        <article class="kpi-card"><h3>Total Matters</h3><p>${matters.length}</p></article>
        <article class="kpi-card"><h3>Overdue Follow-ups</h3><p>${overdueFollowups.length}</p></article>
        <article class="kpi-card"><h3>Delayed Orders</h3><p>${delayedOrders.length}</p></article>
      </div>

      <div class="matter-list" id="matter-list"></div>
    </section>
  `;

  const listEl = appContainer.querySelector("#matter-list");

  if (!matters.length) {
    listEl.innerHTML = '<p class="empty">No matters yet. Click "Create Matter" to start.</p>';
    return;
  }

  matters
    .slice()
    .sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt))
    .forEach((matter) => {
      const flags = [];
      if (isFollowupOverdue(matter)) flags.push("Overdue follow-up");
      if (isOrderDelayed(matter)) flags.push("Delayed order");

      const card = document.createElement("article");
      card.className = "matter-card";
      card.innerHTML = `
        <header>
          <h3><a href="#/matters/${matter.id}">${escapeHtml(matter.title)}</a></h3>
          <p class="matter-meta">${escapeHtml(matter.court)} · ${escapeHtml(matter.county)} County · Judge ${escapeHtml(matter.judge)}</p>
        </header>
        <dl class="matter-details">
          ${detailRow("Status", matter.status)}
          ${detailRow("Follow-up Due", formatDate(matter.followUpDueDate))}
          ${detailRow("Order Expected", formatDate(matter.orderExpectedDate))}
        </dl>
        ${flags.length ? `<p class="flag-row">${flags.map((flag) => `<span class="flag">${flag}</span>`).join("")}</p>` : ""}
      `;
      listEl.append(card);
    });
}

function renderMatterDetailPage(matter) {
  const followupOverdue = isFollowupOverdue(matter);
  const orderDelayed = isOrderDelayed(matter);

  appContainer.innerHTML = `
    <section class="detail-page">
      <div class="detail-head">
        <h2>${escapeHtml(matter.title)}</h2>
        <div class="detail-actions">
          <a class="button-link" href="#/matters/${matter.id}/edit">Edit</a>
          <a class="button-link button-muted" href="#/matters">Back to List</a>
        </div>
      </div>

      <p class="matter-meta">${escapeHtml(matter.court)} · ${escapeHtml(matter.county)} County · Judge ${escapeHtml(matter.judge)}</p>

      <dl class="matter-details detail-grid">
        ${detailRow("Status", matter.status)}
        ${detailRow("Important Date", formatDate(matter.importantDate))}
        ${detailRow("Follow-up Due", formatDate(matter.followUpDueDate))}
        ${detailRow("Order Expected", formatDate(matter.orderExpectedDate))}
        ${detailRow("Order Signed", formatDate(matter.orderSignedDate))}
        ${detailRow("Created", formatDateTime(matter.createdAt))}
      </dl>

      <section class="logic-panel">
        <h3>Workflow Logic</h3>
        <ul>
          <li>Overdue follow-up: <strong>${followupOverdue ? "Yes" : "No"}</strong></li>
          <li>Delayed order: <strong>${orderDelayed ? "Yes" : "No"}</strong></li>
        </ul>
      </section>
    </section>
  `;
}

function renderMatterFormPage(existingMatter = null) {
  const isEdit = Boolean(existingMatter);

  appContainer.innerHTML = `
    <section class="form-page">
      <h2>${isEdit ? "Edit Matter" : "Create Matter"}</h2>
      <form id="matter-form" class="matter-form">
        <div class="grid">
          <label>Title
            <input name="title" required value="${escapeHtml(existingMatter?.title || "")}" />
          </label>
          <label>Court
            <input name="court" required value="${escapeHtml(existingMatter?.court || "")}" />
          </label>
          <label>County
            <input name="county" required value="${escapeHtml(existingMatter?.county || "")}" />
          </label>
          <label>Judge
            <input name="judge" required value="${escapeHtml(existingMatter?.judge || "")}" />
          </label>
          <label>Status
            <select name="status" required>
              ${STATUS_OPTIONS.map((status) => `<option value="${status}" ${existingMatter?.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <label>Important Date
            <input type="date" name="importantDate" required value="${existingMatter?.importantDate || ""}" />
          </label>
          <label>Follow-up Due Date
            <input type="date" name="followUpDueDate" value="${existingMatter?.followUpDueDate || ""}" />
          </label>
          <label>Order Expected Date
            <input type="date" name="orderExpectedDate" value="${existingMatter?.orderExpectedDate || ""}" />
          </label>
          <label>Order Signed Date
            <input type="date" name="orderSignedDate" value="${existingMatter?.orderSignedDate || ""}" />
          </label>
        </div>

        <div class="form-actions">
          <button type="submit">${isEdit ? "Save Changes" : "Create Matter"}</button>
          <a class="button-link button-muted" href="${isEdit ? `#/matters/${existingMatter.id}` : "#/matters"}">Cancel</a>
        </div>
      </form>
    </section>
  `;

  const form = appContainer.querySelector("#matter-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    const payload = {
      title: formData.get("title")?.toString().trim() || "",
      court: formData.get("court")?.toString().trim() || "",
      county: formData.get("county")?.toString().trim() || "",
      judge: formData.get("judge")?.toString().trim() || "",
      status: formData.get("status")?.toString() || "open",
      importantDate: formData.get("importantDate")?.toString() || "",
      followUpDueDate: formData.get("followUpDueDate")?.toString() || "",
      orderExpectedDate: formData.get("orderExpectedDate")?.toString() || "",
      orderSignedDate: formData.get("orderSignedDate")?.toString() || "",
    };

    if (isEdit) {
      matters = matters.map((item) => (item.id === existingMatter.id ? { ...item, ...payload } : item));
      saveMatters();
      window.location.hash = `#/matters/${existingMatter.id}`;
      return;
    }

    const newMatter = {
      id: generateMatterId(),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    matters.unshift(newMatter);
    saveMatters();
    window.location.hash = `#/matters/${newMatter.id}`;
  });
}

function renderNotFound(message) {
  appContainer.innerHTML = `
    <section>
      <h2>${message}</h2>
      <a class="button-link" href="#/matters">Back to Matter List</a>
    </section>
  `;
}

function isFollowupOverdue(matter) {
  if (!matter.followUpDueDate) return false;
  if (matter.status === "closed") return false;
  return isPast(matter.followUpDueDate);
}

function isOrderDelayed(matter) {
  if (!matter.orderExpectedDate) return false;
  if (matter.orderSignedDate) return false;
  if (!["order pending", "open"].includes(matter.status)) return false;
  return isPast(matter.orderExpectedDate);
}

function isPast(dateString) {
  if (!dateString) return false;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(`${dateString}T00:00:00Z`);

  return Number.isFinite(target.getTime()) && target < today;
}

function detailRow(label, value) {
  return `<div><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function dateValue(value) {
  const date = new Date(value || "");
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function generateMatterId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `matter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
