# TRACE — WebMCP Alpha

TRACE is a Work Memory app: it helps a user resume work from accumulated context —
earlier records, confirmed decisions, the current state, and unfinished next steps —
without re-explaining everything.

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

## Challenge scenario: Cafe Launch

1. The user asks the agent to continue the cafe-property work.
2. The agent calls `search_cores` with `cafe startup` and finds `cafe-2026`.
3. The agent calls `get_core_context` and receives, in one response:
   - 3 chronological fictional context records with evidence-attachment metadata;
   - the current state and 2 confirmed decisions;
   - 2 distinct unfinished next steps.
4. From that saved context, the agent can explain why Property B is leading and what
   remains unverified.
5. The agent proposes a new action. Only after the user approves the exact text does the
   agent call `confirm_next_action`.
6. The approved action is **appended** as a third next step; it does not overwrite the
   existing two. Refreshing the page keeps it in this browser's `localStorage`.
7. **Reset demo state** restores exactly the original two Cafe Launch next steps.

This follows TRACE's original product principle: the agent never decides the next action
on its own — only what the user has confirmed gets written.

The demo intentionally does **not** add or claim a context graph. Its `contextRecords`
array is a compact challenge representation of accumulated capture/log context, not an
exact copy of TRACE's production storage schema. The agent receives the saved record
notes and attachment metadata; this demo does not claim that the agent analyzed image
pixels.

## What's included / real TRACE code reused

- `coreSearch.js` — copied unchanged from the real TRACE repository
  (`src/services/coreSearch.js`), byte-identical (SHA-256 match, not a reimplementation).
  It's TRACE's actual Korean-aware search matching logic: it filters out conversational
  filler words ("아", "그거", "찾아줘", etc.) and normalizes a small set of inflected forms
  via an alias map. It does **not** strip Korean particles (조사, e.g. -을/를/이/가) through
  morphological analysis, so a query with a particle still attached (e.g. "계약서를") is
  treated as a different string from the stored word ("계약서") and may not match — it works
  best when searching with the bare keyword.
- `data.js` — 4 fictional demo Cores, schema migration for the earlier singular
  `nextAction`, accumulated Cafe Launch context, multiple next steps, and `localStorage`
  persistence helpers.
- `app.js` — page rendering plus registration of the 3 WebMCP tools (`search_cores`,
  `get_core_context`, `confirm_next_action`). Tool names and input schemas remain stable.
- `index.html` — page shell.
- `assets/` — 3 fictional AI-generated evidence images made for this challenge demo.
  They contain no real people, properties, accounts, or user data.

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
  automatically. When an agent calls a tool, the page (Core list, context trail, current
  state, and next steps) updates live in the same view.
- To check directly from the developer console:
  ```js
  document.modelContext.getTools()
  ```

### Suggested end-to-end test

1. Call `search_cores` with `cafe startup`.
2. Call `get_core_context` with `cafe-2026`; confirm 3 context records and 2 open next
   steps are returned.
3. Ask the user to approve `Visit Property B tomorrow at 2 PM.`
4. After explicit approval, call `confirm_next_action` with that exact text.
5. Confirm the page shows 3 open next steps and the new one is labeled
   **User-approved**.
6. Refresh: the third step should remain. Reset: the Cafe Launch Core should return to
   its original 2 steps.

Blank actions and matching duplicate actions are rejected without saving.

## License

[MIT](./LICENSE)
