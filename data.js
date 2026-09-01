// Fictional demo Core data for the WebMCP Challenge. Not real TRACE user data.
// English is primary here so judges/agents reading in English see a coherent
// scenario; Korean search tags are kept so the Korean-native search logic
// (coreSearch.js) still stays meaningfully exercised.
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
    nextAction: "Contact the real estate agent to reconfirm the special lease terms",
    tags: ["이사", "계약", "부동산", "moving", "relocation", "contract", "lease"]
  },
  {
    id: "cafe-2026",
    name: "Cafe Launch",
    summary: "Comparing rental properties and negotiating key money",
    status: "Comparing two rental properties near a transit station",
    decisions: [
      "Prioritized locations near a transit station",
      "Narrowed down to properties with room for key-money negotiation"
    ],
    nextAction: "Schedule a visit to the second property",
    tags: ["창업", "카페", "임대", "cafe", "startup", "rent"]
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
    nextAction: "Put together a restaurant list for day 3",
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
    nextAction: "Add summaries of 3 recent projects to the portfolio",
    tags: ["이직", "이력서", "커리어", "job", "career", "resume", "interview"]
  }
];

export function loadCores() {
  try {
    const saved = localStorage.getItem("webmcp_demo_cores");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(SEED_CORES));
}

export function saveCores(cores) {
  localStorage.setItem("webmcp_demo_cores", JSON.stringify(cores));
}

export function resetCores() {
  localStorage.removeItem("webmcp_demo_cores");
}
