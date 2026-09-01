# TRACE — WebMCP Alpha

TRACE is a Work Memory app: it saves the context of a task (Core) a user was working on
— its current status, confirmed decisions, and next action — so the user can pick it back
up later without re-explaining everything.

This repository is a **public alpha** submitted to
[The WebMCP Challenge](https://webmcp.devpost.com/). It reuses TRACE's real Core search
logic (`coreSearch.js`) and exposes it directly to agents via the
[WebMCP](https://github.com/webmachinelearning/webmcp) standard — no server or API key
required, just `document.modelContext.registerTool()` calls inside the page.

## What this repository is not

- Not TRACE's production service code. The real TRACE app runs from a separate private
  repository.
- The Core data here is **entirely fictional test data**. No real user data, real accounts,
  or production database is used anywhere in this project.
- Payment, auth, desktop app, and internal operations code are intentionally excluded —
  they're unrelated to this submission.

## Scenario

1. The user says: "Continue what I was doing about the moving contract / cafe rental."
2. The agent calls `search_cores` to find the relevant Core.
3. The agent calls `get_core_context` to restore the saved decisions, current status, and
   next action.
4. The agent proposes a next action; once the user approves it, the agent calls
   `confirm_next_action` to reflect it.

This follows TRACE's original product principle: the agent never decides the next action
on its own — only what the user has confirmed gets written.

## What's included / real TRACE code reused

- `coreSearch.js` — copied unchanged from the real TRACE repository
  (`src/services/coreSearch.js`), byte-identical (SHA-256 match, not a reimplementation).
  It's TRACE's actual Korean-aware search matching logic: it filters out conversational
  filler words ("아", "그거", "찾아줘", etc.) and normalizes a small set of inflected forms
  via an alias map. It does **not** strip Korean particles (조사, e.g. -을/를/이/가) through
  morphological analysis, so a query with a particle still attached (e.g. "계약서를") is
  treated as a different string from the stored word ("계약서") and may not match — it works
  best when searching with the bare keyword.
- `data.js` — 4 fictional demo Cores (test data) plus `localStorage` persistence helpers.
- `app.js` — page rendering plus registration of the 3 WebMCP tools (`search_cores`,
  `get_core_context`, `confirm_next_action`).
- `index.html` — page shell.

## Install & run

No backend, database, environment variables, or login required. It's a static site.

```bash
npm start
# or
npx serve .
```

Open `http://localhost:4173` (or whatever address is printed) in a browser.

## How to test WebMCP

- **Regular browser**: the page just renders normally (for a human to click through,
  without agent tools). If the browser doesn't support `document.modelContext`, the
  "Agent activity log" panel at the bottom shows a notice saying so.
- **WebMCP-enabled browser / ChatGPT in-app browser**: on page load, the 3 tools register
  automatically. When an agent calls a tool, the page (Core list, detail, next action)
  updates live in the same view.
- To check directly from the developer console:
  ```js
  document.modelContext.getTools()
  ```

## License

[MIT](./LICENSE)
