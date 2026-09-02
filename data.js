// Fictional demo Core data for the WebMCP Challenge. Not real TRACE user data.
// English is primary here so judges/agents reading in English see a coherent
// scenario; Korean search tags remain so TRACE's real Korean-native search
// logic (coreSearch.js) still stays meaningfully exercised.

const STORAGE_KEY = "webmcp_demo_cores";
const SCHEMA_VERSION = 2;
const LEGACY_DEFAULT_ACTIONS = new Set([
  "Contact the real estate agent to reconfirm the special lease terms",
  "Schedule a visit to the second property",
  "Put together a restaurant list for day 3",
  "Add summaries of 3 recent projects to the portfolio"
]);

const SEED_CORES = [
  {
    id: "move-2026",
    name: "Moving Preparation",
    summary: "Reviewing the new lease and coordinating the move-in date",
    status: "Reviewing the new lease agreement; move-in date under negotiation",
    decisions: [
      "Deposit confirmed at 50,000,000 KRW",
      "Move-in date being coordinated around March 15"
    ],
    contextRecords: [],
    nextSteps: [
      {
        id: "move-step-1",
        text: "Contact the real estate agent to reconfirm the special lease terms",
        done: false,
        createdAt: "2026-08-30T09:00:00+09:00",
        source: "saved-context"
      }
    ],
    tags: ["이사", "계약", "부동산", "moving", "relocation", "contract", "lease"]
  },
  {
    id: "cafe-2026",
    name: "Cafe Launch",
    summary: "Comparing rental properties and verifying the leading candidate",
    status: "Property B is leading; operating costs and lease terms still need verification",
    decisions: [
      "Prioritized foot traffic and access to a transit station",
      "Continue due diligence on Property B, where key money may be negotiable"
    ],
    contextRecords: [
      {
        id: "cafe-record-a",
        capturedAt: "2026-08-22T14:30:00+09:00",
        kind: "Site visit",
        title: "Property A visit",
        note: "Rent was within budget, but the 18-minute walk from the station failed the transit requirement.",
        image: "assets/property-a.jpg",
        imageAlt: "Fictional exterior of Property A on a quiet side street"
      },
      {
        id: "cafe-record-b",
        capturedAt: "2026-08-27T16:10:00+09:00",
        kind: "Property review",
        title: "Property B review",
        note: "A three-minute walk from the station with stronger foot traffic; the landlord is open to key-money negotiation.",
        image: "assets/property-b.jpg",
        imageAlt: "Fictional exterior of Property B near a transit station"
      },
      {
        id: "cafe-record-decision",
        capturedAt: "2026-08-30T10:00:00+09:00",
        kind: "Decision note",
        title: "Candidate comparison",
        note: "Prioritize foot traffic and transit access. Continue reviewing Property B, but verify recurring costs and lease limits before committing.",
        image: "assets/property-comparison.jpg",
        imageAlt: "Fictional desk with property comparison materials"
      }
    ],
    nextSteps: [
      {
        id: "cafe-step-utilities",
        text: "Request the last 12 months of utility-cost records for Property B",
        done: false,
        createdAt: "2026-08-30T10:05:00+09:00",
        source: "saved-context"
      },
      {
        id: "cafe-step-lease",
        text: "Review Property B's lease clauses against the budget cap",
        done: false,
        createdAt: "2026-08-30T10:06:00+09:00",
        source: "saved-context"
      }
    ],
    tags: ["창업", "카페", "임대", "cafe", "startup", "rent", "property", "storefront"]
  },
  {
    id: "jeju-2026",
    name: "Jeju Trip Planning",
    summary: "4-night 5-day itinerary with lodging and rental car booked",
    status: "Lodging and rental car booked; drafting the detailed itinerary",
    decisions: [
      "Confirmed a 4-night, 5-day itinerary",
      "Booked a mid-size SUV rental car"
    ],
    contextRecords: [],
    nextSteps: [
      {
        id: "jeju-step-1",
        text: "Put together a restaurant list for day 3",
        done: false,
        createdAt: "2026-08-30T09:00:00+09:00",
        source: "saved-context"
      }
    ],
    tags: ["여행", "제주", "일정", "jeju", "travel", "trip"]
  },
  {
    id: "job-2026",
    name: "Job Change Prep",
    summary: "Updating resume and preparing for interviews",
    status: "Resume draft complete; organizing portfolio",
    decisions: [
      "Narrowed target role to Product Manager",
      "Will ask former team lead for a reference"
    ],
    contextRecords: [],
    nextSteps: [
      {
        id: "job-step-1",
        text: "Add summaries of 3 recent projects to the portfolio",
        done: false,
        createdAt: "2026-08-30T09:00:00+09:00",
        source: "saved-context"
      }
    ],
    tags: ["이직", "이력서", "커리어", "job", "career", "resume", "interview"]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

function normalizeStep(step, fallbackId) {
  const text = typeof step === "string" ? step.trim() : String(step?.text ?? "").trim();
  if (!text) return null;
  return {
    id: typeof step === "object" && step?.id ? String(step.id) : fallbackId,
    text,
    done: Boolean(typeof step === "object" && step?.done),
    createdAt:
      typeof step === "object" && step?.createdAt
        ? String(step.createdAt)
        : new Date().toISOString(),
    source:
      typeof step === "object" && step?.source
        ? String(step.source)
        : "migrated-local-state"
  };
}

function mergeNextSteps(seedCore, savedCore) {
  const savedSteps = Array.isArray(savedCore?.nextSteps) ? savedCore.nextSteps : [];
  const normalizedSaved = savedSteps
    .map((step, index) => normalizeStep(step, `${seedCore.id}-saved-${index + 1}`))
    .filter(Boolean);

  const legacyText = String(savedCore?.nextAction ?? "").trim();
  if (legacyText && !LEGACY_DEFAULT_ACTIONS.has(legacyText)) {
    normalizedSaved.push(
      normalizeStep(legacyText, `${seedCore.id}-legacy-${Date.now()}`)
    );
  }

  const merged = [];
  for (const step of [...clone(seedCore.nextSteps), ...normalizedSaved]) {
    const normalized = normalizeStep(step, `${seedCore.id}-step-${merged.length + 1}`);
    if (!normalized) continue;
    const key = normalizeText(normalized.text);
    const existing = merged.find((candidate) => normalizeText(candidate.text) === key);
    if (existing) {
      if (normalized.done) existing.done = true;
      continue;
    }
    merged.push(normalized);
  }
  return merged;
}

function normalizeCore(seedCore, savedCore) {
  if (!savedCore) return clone(seedCore);
  return {
    ...clone(seedCore),
    name: String(savedCore.name ?? seedCore.name),
    summary: String(savedCore.summary ?? seedCore.summary),
    status: String(savedCore.status ?? seedCore.status),
    decisions: Array.isArray(savedCore.decisions)
      ? savedCore.decisions.map(String)
      : clone(seedCore.decisions),
    tags: Array.isArray(savedCore.tags) ? savedCore.tags.map(String) : clone(seedCore.tags),
    // Challenge context records are fixed fictional evidence. They are restored
    // during migration so an older localStorage snapshot gains the new trail.
    contextRecords: clone(seedCore.contextRecords),
    nextSteps: mergeNextSteps(seedCore, savedCore)
  };
}

export function loadCores() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(SEED_CORES);
    const parsed = JSON.parse(saved);
    const savedCores = Array.isArray(parsed) ? parsed : parsed?.cores;
    if (!Array.isArray(savedCores)) return clone(SEED_CORES);
    return SEED_CORES.map((seedCore) =>
      normalizeCore(seedCore, savedCores.find((core) => core?.id === seedCore.id))
    );
  } catch {
    return clone(SEED_CORES);
  }
}

export function saveCores(cores) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, cores })
  );
}

export function resetCores() {
  localStorage.removeItem(STORAGE_KEY);
}
