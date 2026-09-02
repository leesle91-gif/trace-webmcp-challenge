// TRACE — WebMCP Challenge demo
// Human-facing rendering and agent-facing WebMCP tools operate on the same
// fictional local state. Agent writes are allowed only after user approval.
//
// search_cores imports TRACE's byte-identical production search module.
// The context trail is a challenge-demo representation of accumulated
// captures/log notes; it is not a claim that production TRACE stores a graph.

import { loadCores, saveCores, resetCores } from "./data.js";
import { matchesCoreSearch } from "./coreSearch.js";

let cores = loadCores();
let selectedId = cores.find((core) => core.id === "cafe-2026")?.id ?? cores[0]?.id ?? null;

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getOpenNextSteps(core) {
  return Array.isArray(core.nextSteps) ? core.nextSteps.filter((step) => !step.done) : [];
}

function render() {
  renderList();
  renderDetail();
}

function renderList() {
  const list = document.getElementById("core-list");
  list.innerHTML = "";
  cores.forEach((core) => {
    const li = document.createElement("li");
    li.className = "core-item" + (core.id === selectedId ? " active" : "");
    li.innerHTML =
      "<strong>" + escapeHtml(core.name) + "</strong>" +
      "<span>" + escapeHtml(core.summary) + "</span>" +
      "<small>" + getOpenNextSteps(core).length + " open next step(s)</small>";
    li.addEventListener("click", () => {
      selectedId = core.id;
      render();
    });
    list.appendChild(li);
  });
}

function renderContextTrail(records) {
  if (!records?.length) {
    return "<p class='muted empty-state'>No context records in this compact demo Core.</p>";
  }
  const chronological = [...records].sort(
    (a, b) => new Date(a.capturedAt) - new Date(b.capturedAt)
  );
  return (
    '<div class="context-trail">' +
    chronological.map((record, index) =>
      '<article class="context-card">' +
        '<div class="context-image-wrap">' +
          '<img src="' + escapeHtml(record.image) + '" alt="' +
            escapeHtml(record.imageAlt) + '" class="context-image" />' +
          '<span class="record-order">' + (index + 1) + "</span>" +
          '<span class="fictional-badge">Fictional demo capture</span>' +
        "</div>" +
        '<div class="context-card-body">' +
          '<div class="record-meta"><span>' + escapeHtml(record.kind) + "</span>" +
            '<time datetime="' + escapeHtml(record.capturedAt) + '">' +
              escapeHtml(formatDate(record.capturedAt)) + "</time></div>" +
          "<h4>" + escapeHtml(record.title) + "</h4>" +
          "<p>" + escapeHtml(record.note) + "</p>" +
        "</div>" +
      "</article>"
    ).join("") +
    "</div>"
  );
}

function renderNextSteps(core) {
  const steps = getOpenNextSteps(core);
  if (!steps.length) {
    return "<p class='muted empty-state'>No open next steps.</p>";
  }
  return (
    '<ol class="next-steps">' +
    steps.map((step) =>
      "<li>" +
        '<span class="step-marker" aria-hidden="true"></span>' +
        "<div>" +
          '<span class="step-text">' + escapeHtml(step.text) + "</span>" +
          (step.source === "user-approved"
            ? '<small class="approved-label">User-approved</small>'
            : "") +
        "</div>" +
      "</li>"
    ).join("") +
    "</ol>"
  );
}

function renderDetail() {
  const core = cores.find((candidate) => candidate.id === selectedId);
  const element = document.getElementById("core-detail");
  if (!core) {
    element.innerHTML = "<p class='muted'>Select a Core on the left.</p>";
    return;
  }

  element.innerHTML =
    '<div class="detail-heading"><div>' +
      '<p class="eyebrow">Saved work context</p>' +
      "<h2>" + escapeHtml(core.name) + "</h2>" +
    '</div><span class="local-badge">Local demo state</span></div>' +
    '<section class="current-state">' +
      '<p class="section-label">Current state</p>' +
      '<p class="status"><span class="dot"></span>' + escapeHtml(core.status) + "</p>" +
    "</section>" +
    '<section class="detail-section">' +
      '<div class="section-heading"><div>' +
        '<p class="section-label">Earlier evidence</p><h3>Context trail</h3>' +
      '</div><span class="section-count">' + (core.contextRecords?.length ?? 0) +
        " records</span></div>" +
      renderContextTrail(core.contextRecords) +
    "</section>" +
    '<div class="outcome-grid">' +
      '<section class="detail-section decision-panel">' +
        '<p class="section-label">What was confirmed</p><h3>Decisions</h3>' +
        '<ul class="decision-list">' +
          core.decisions.map((decision) => "<li>" + escapeHtml(decision) + "</li>").join("") +
        "</ul>" +
      "</section>" +
      '<section class="detail-section next-panel">' +
        '<div class="section-heading compact"><div>' +
          '<p class="section-label">What remains</p><h3>Next steps</h3>' +
        '</div><span class="section-count">' + getOpenNextSteps(core).length +
          " open</span></div>" +
        renderNextSteps(core) +
      "</section>" +
    "</div>";
}

function logAgentEvent(text) {
  const log = document.getElementById("agent-log");
  const line = document.createElement("div");
  line.className = "agent-log-line";
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  line.textContent = "[" + time + "] " + text;
  log.prepend(line);
}

function normalizeActionText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

function actionsAreSimilar(first, second) {
  const a = normalizeActionText(first);
  const b = normalizeActionText(second);
  if (!a || !b) return false;
  if (a === b) return true;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union > 0 && intersection / union >= 0.8;
}

function makeStepId(coreId) {
  if (globalThis.crypto?.randomUUID) return coreId + "-" + crypto.randomUUID();
  return coreId + "-" + Date.now();
}

function contextRecordsForTool(core) {
  if (!core.contextRecords?.length) {
    return "- No context records in this compact demo Core.";
  }
  return [...core.contextRecords]
    .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt))
    .map((record) =>
      "- " + formatDate(record.capturedAt) + " [" + record.kind + "] " +
      record.title + ": " + record.note +
      " (fictional attachment: " + record.image + ")"
    )
    .join("\n");
}

async function registerWebMcpTools() {
  if (!("modelContext" in document)) {
    logAgentEvent("This browser does not support WebMCP (document.modelContext not found).");
    return;
  }

  await document.modelContext.registerTool({
    name: "search_cores",
    description:
      "Search the user's saved work items (Cores) in TRACE by keyword. " +
      "When the user asks about something they were working on before, use this tool first to find the relevant Core.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (e.g. 'moving', 'cafe', 'trip')" }
      },
      required: ["query"]
    },
    async execute({ query }) {
      const matches = cores.filter((core) =>
        matchesCoreSearch(query, [core.name, core.summary, core.tags])
      );
      logAgentEvent('Agent searched Cores for "' + query + '" → ' + matches.length + " match(es)");
      return {
        content: [{
          type: "text",
          text: matches.length
            ? matches.map((core) =>
                "- " + core.id + ": " + core.name + " — " + core.summary
              ).join("\n")
            : "No matching Core found."
        }]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "get_core_context",
    description:
      "Load a specific Core's saved chronological context records, current state, confirmed decisions, " +
      "and open next steps. Call with a core_id found via search_cores. When the user asks where they " +
      "left off, use this tool to check the actual saved demo state before answering.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "Core id returned by search_cores" }
      },
      required: ["core_id"]
    },
    async execute({ core_id }) {
      const core = cores.find((candidate) => candidate.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: 'Could not find core_id "' + core_id + '".' }] };
      }
      selectedId = core.id;
      render();
      logAgentEvent('Agent loaded accumulated context for "' + core.name + '"');
      const nextSteps = getOpenNextSteps(core);
      return {
        content: [{
          type: "text",
          text:
            "Name: " + core.name + "\nCurrent state: " + core.status + "\n\n" +
            "Context records (chronological):\n" + contextRecordsForTool(core) + "\n\n" +
            "Confirmed decisions:\n" +
              core.decisions.map((decision) => "- " + decision).join("\n") + "\n\n" +
            "Open next steps (" + nextSteps.length + "):\n" +
              nextSteps.map((step, index) => (index + 1) + ". " + step.text).join("\n")
        }]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "confirm_next_action",
    description:
      "Append one user-approved next action to a Core without overwriting existing open steps. " +
      "TRACE's principle: the agent never decides or saves a next action on its own. Propose it first, " +
      "then call this tool only with the exact action the user approved.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "Target Core id" },
        next_action: { type: "string", description: "The exact next-action text the user approved" }
      },
      required: ["core_id", "next_action"]
    },
    async execute({ core_id, next_action }) {
      const core = cores.find((candidate) => candidate.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: 'Could not find core_id "' + core_id + '".' }] };
      }

      const approvedText = String(next_action ?? "").trim();
      if (!approvedText) {
        logAgentEvent('Rejected a blank next action for "' + core.name + '" — nothing saved');
        return { content: [{ type: "text", text: "Next action cannot be blank. Nothing was saved." }] };
      }

      const duplicate = getOpenNextSteps(core).find((step) =>
        actionsAreSimilar(step.text, approvedText)
      );
      if (duplicate) {
        logAgentEvent('Skipped a duplicate next action for "' + core.name + '" — nothing saved');
        return {
          content: [{
            type: "text",
            text: 'Not added: a matching open next step already exists — "' + duplicate.text + '".'
          }]
        };
      }

      core.nextSteps.push({
        id: makeStepId(core.id),
        text: approvedText,
        done: false,
        createdAt: new Date().toISOString(),
        source: "user-approved"
      });
      saveCores(cores);
      selectedId = core.id;
      render();
      logAgentEvent(
        'Agent added a user-approved next step for "' + core.name + '" → "' + approvedText + '"'
      );
      return {
        content: [{
          type: "text",
          text:
            'Added approved next step for "' + core.name + '": ' + approvedText + "\n" +
            "Open next steps: " + getOpenNextSteps(core).length +
            ". Saved in this browser's local demo state."
        }]
      };
    }
  });

  logAgentEvent("Registered 3 WebMCP tools (search_cores, get_core_context, confirm_next_action)");
}

document.getElementById("reset-demo-btn").addEventListener("click", () => {
  resetCores();
  cores = loadCores();
  selectedId = cores.find((core) => core.id === "cafe-2026")?.id ?? cores[0]?.id ?? null;
  render();
  logAgentEvent("Demo reset: fictional seed data restored in this browser");
});

render();
registerWebMcpTools();
