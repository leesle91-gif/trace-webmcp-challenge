// TRACE — WebMCP Alpha
// 사람이 화면으로 보는 렌더링 + 에이전트가 쓰는 WebMCP 도구 등록을 같은 상태(state)에
// 대해 같이 동작하게 한다. 에이전트가 도구를 호출해 상태를 바꾸면 화면도 즉시 같이
// 바뀐다 — "AI가 대신 결정하지 않고, 사용자가 보는 화면 위에서 확인 가능한 형태로
// 다음 행동을 남긴다"는 TRACE 원칙을 그대로 보여주기 위함.
//
// search_cores 도구는 TRACE 실제 저장소(src/services/coreSearch.js)의 한국어 조사
// 인식 검색 로직을 그대로 가져와 쓴다 — 이 파일만 재구현이 아니라 실제 TRACE 코드다.
// 화면·도구 텍스트는 영어(심사용), Core 데이터의 검색 태그는 한국어/영어를 같이 둔다.

import { loadCores, saveCores, resetCores } from "./data.js";
import { matchesCoreSearch } from "./coreSearch.js";

let cores = loadCores();
let selectedId = cores[0]?.id ?? null;

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
    li.innerHTML = `<strong>${escapeHtml(core.name)}</strong><span>${escapeHtml(core.summary)}</span>`;
    li.addEventListener("click", () => {
      selectedId = core.id;
      render();
    });
    list.appendChild(li);
  });
}

function renderDetail() {
  const core = cores.find((c) => c.id === selectedId);
  const el = document.getElementById("core-detail");
  if (!core) {
    el.innerHTML = "<p class='muted'>Select a Core on the left.</p>";
    return;
  }
  el.innerHTML = `
    <h2>${escapeHtml(core.name)}</h2>
    <p class="status"><span class="dot"></span>${escapeHtml(core.status)}</p>
    <h3>Confirmed decisions</h3>
    <ul>${core.decisions.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
    <h3>Next action</h3>
    <p class="next-action" id="next-action-text">${escapeHtml(core.nextAction)}</p>
  `;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = String(s ?? "");
  return div.innerHTML;
}

function logAgentEvent(text) {
  const log = document.getElementById("agent-log");
  const line = document.createElement("div");
  line.className = "agent-log-line";
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  line.textContent = `[${time}] ${text}`;
  log.prepend(line);
}

// ─── WebMCP 도구 등록 ─────────────────────────────────────────────
// document.modelContext가 있는 브라우저(WebMCP 활성화 Chrome, ChatGPT 인앱 브라우저
// 등)에서만 등록한다. 없는 브라우저에서는 그냥 평범한 웹페이지로만 보인다.
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
      const matches = cores.filter((c) =>
        matchesCoreSearch(query, [c.name, c.summary, c.tags])
      );
      logAgentEvent(`Agent searched Cores for "${query}" → ${matches.length} match(es)`);
      return {
        content: [
          {
            type: "text",
            text: matches.length
              ? matches.map((c) => `- ${c.id}: ${c.name} — ${c.summary}`).join("\n")
              : "No matching Core found."
          }
        ]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "get_core_context",
    description:
      "Load a specific Core's current status, confirmed decisions, and next action. " +
      "Call with a core_id found via search_cores. When the user asks 'where did I leave off', " +
      "use this tool to check the actual saved state before answering.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "Core id returned by search_cores" }
      },
      required: ["core_id"]
    },
    async execute({ core_id }) {
      const core = cores.find((c) => c.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: `Could not find core_id "${core_id}".` }] };
      }
      selectedId = core.id;
      render();
      logAgentEvent(`Agent loaded context for "${core.name}"`);
      return {
        content: [
          {
            type: "text",
            text:
              `Name: ${core.name}\nStatus: ${core.status}\n` +
              `Decisions:\n${core.decisions.map((d) => "- " + d).join("\n")}\n` +
              `Current next action: ${core.nextAction}`
          }
        ]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "confirm_next_action",
    description:
      "Reflect a user-approved next action onto a Core. " +
      "TRACE's principle: the agent never decides the next action on its own — always propose it " +
      "to the user first, and only call this tool with what the user has approved.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "Target Core id" },
        next_action: { type: "string", description: "The next-action text the user approved" }
      },
      required: ["core_id", "next_action"]
    },
    async execute({ core_id, next_action }) {
      const core = cores.find((c) => c.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: `Could not find core_id "${core_id}".` }] };
      }
      core.nextAction = String(next_action);
      saveCores(cores);
      selectedId = core.id;
      render();
      logAgentEvent(`Agent updated the next action for "${core.name}" → "${next_action}"`);
      return {
        content: [{ type: "text", text: `Updated next action for "${core.name}": ${next_action}` }]
      };
    }
  });

  logAgentEvent("Registered 3 WebMCP tools (search_cores, get_core_context, confirm_next_action)");
}

document.getElementById("reset-demo-btn").addEventListener("click", () => {
  resetCores();
  cores = loadCores();
  selectedId = cores[0]?.id ?? null;
  render();
  logAgentEvent("Demo data reset to initial state");
});

render();
registerWebMcpTools();
