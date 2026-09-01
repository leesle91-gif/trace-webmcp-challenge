// TRACE — WebMCP Alpha
// 사람이 화면으로 보는 렌더링 + 에이전트가 쓰는 WebMCP 도구 등록을 같은 상태(state)에
// 대해 같이 동작하게 한다. 에이전트가 도구를 호출해 상태를 바꾸면 화면도 즉시 같이
// 바뀐다 — "AI가 대신 결정하지 않고, 사용자가 보는 화면 위에서 확인 가능한 형태로
// 다음 행동을 남긴다"는 TRACE 원칙을 그대로 보여주기 위함.
//
// search_cores 도구는 TRACE 실제 저장소(src/services/coreSearch.js)의 한국어 조사
// 인식 검색 로직을 그대로 가져와 쓴다 — 이 파일만 재구현이 아니라 실제 TRACE 코드다.

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
    el.innerHTML = "<p class='muted'>왼쪽에서 Core를 선택하세요.</p>";
    return;
  }
  el.innerHTML = `
    <h2>${escapeHtml(core.name)}</h2>
    <p class="status"><span class="dot"></span>${escapeHtml(core.status)}</p>
    <h3>확인된 결정</h3>
    <ul>${core.decisions.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
    <h3>다음 행동</h3>
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
  const time = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  line.textContent = `[${time}] ${text}`;
  log.prepend(line);
}

// ─── WebMCP 도구 등록 ─────────────────────────────────────────────
// document.modelContext가 있는 브라우저(WebMCP 활성화 Chrome, ChatGPT 인앱 브라우저
// 등)에서만 등록한다. 없는 브라우저에서는 그냥 평범한 웹페이지로만 보인다.
async function registerWebMcpTools() {
  if (!("modelContext" in document)) {
    logAgentEvent("이 브라우저는 WebMCP를 지원하지 않습니다 (document.modelContext 없음).");
    return;
  }

  await document.modelContext.registerTool({
    name: "search_cores",
    description:
      "사용자가 TRACE에 남겨둔 작업(Core) 중 키워드와 관련된 것을 검색합니다. " +
      "사용자가 예전에 하던 일을 다시 물어볼 때 먼저 이 도구로 관련 Core를 찾으세요.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "검색어 (예: '이사', '카페', '여행')" }
      },
      required: ["query"]
    },
    async execute({ query }) {
      const matches = cores.filter((c) =>
        matchesCoreSearch(query, [c.name, c.summary, c.tags])
      );
      logAgentEvent(`에이전트가 "${query}"로 Core를 검색 → ${matches.length}건`);
      return {
        content: [
          {
            type: "text",
            text: matches.length
              ? matches.map((c) => `- ${c.id}: ${c.name} — ${c.summary}`).join("\n")
              : "관련 Core를 찾지 못했습니다."
          }
        ]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "get_core_context",
    description:
      "특정 Core의 현재 상태, 지금까지 확인된 결정, 다음 행동을 불러옵니다. " +
      "search_cores로 찾은 core_id를 넣어 호출하세요. 사용자가 '어디까지 했었지' 라고 " +
      "물어볼 때 이 도구로 실제 근거를 확인한 뒤 답하세요.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "search_cores 결과의 Core id" }
      },
      required: ["core_id"]
    },
    async execute({ core_id }) {
      const core = cores.find((c) => c.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: `core_id "${core_id}"를 찾을 수 없습니다.` }] };
      }
      selectedId = core.id;
      render();
      logAgentEvent(`에이전트가 "${core.name}" 맥락을 조회함`);
      return {
        content: [
          {
            type: "text",
            text:
              `이름: ${core.name}\n상태: ${core.status}\n` +
              `결정:\n${core.decisions.map((d) => "- " + d).join("\n")}\n` +
              `현재 다음 행동: ${core.nextAction}`
          }
        ]
      };
    }
  });

  await document.modelContext.registerTool({
    name: "confirm_next_action",
    description:
      "사용자가 확인/승인한 다음 행동을 해당 Core에 반영합니다. " +
      "TRACE 원칙상 에이전트가 임의로 다음 행동을 정하지 않습니다 — 반드시 사용자에게 " +
      "먼저 제안하고, 사용자가 승인한 내용만 이 도구로 반영하세요.",
    inputSchema: {
      type: "object",
      properties: {
        core_id: { type: "string", description: "대상 Core id" },
        next_action: { type: "string", description: "사용자가 승인한 다음 행동 문구" }
      },
      required: ["core_id", "next_action"]
    },
    async execute({ core_id, next_action }) {
      const core = cores.find((c) => c.id === core_id);
      if (!core) {
        return { content: [{ type: "text", text: `core_id "${core_id}"를 찾을 수 없습니다.` }] };
      }
      core.nextAction = String(next_action);
      saveCores(cores);
      selectedId = core.id;
      render();
      logAgentEvent(`에이전트가 "${core.name}"의 다음 행동을 갱신함 → "${next_action}"`);
      return {
        content: [{ type: "text", text: `"${core.name}"의 다음 행동을 반영했습니다: ${next_action}` }]
      };
    }
  });

  logAgentEvent("WebMCP 도구 3개 등록 완료 (search_cores, get_core_context, confirm_next_action)");
}

document.getElementById("reset-demo-btn").addEventListener("click", () => {
  resetCores();
  cores = loadCores();
  selectedId = cores[0]?.id ?? null;
  render();
  logAgentEvent("데모 데이터를 초기 상태로 리셋함");
});

render();
registerWebMcpTools();
