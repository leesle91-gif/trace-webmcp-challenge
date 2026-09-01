const CONVERSATIONAL_NOISE = new Set([
  "아", "그", "그거", "저거", "내가", "전에", "예전에", "좀", "관련",
  "문서", "자료", "사진", "캡처", "있는데", "잇는데", "있지", "잇지",
  "어디", "어딨지", "어딧지", "찾아", "찾아줘", "보여줘", "열어줘",
  "아까", "우리", "우리가", "방금", "만든", "얘기하던", "거", "이어서",
  "보자", "다음에", "뭘", "뭐", "뭐였지", "하기로", "했었지", "했지", "아직", "안",
  "끝났잖아", "끝났지", "다시", "계속",
]);

// 한국어 조사를 전부 추측해 자르는 대신, Core 재개 대화에서 실제로 확인된 소수 표현만
// 저장된 제목 형태로 맞춘다. 의미를 새로 만들지 않고 같은 행동의 문법형만 정규화한다.
const SEARCH_TERM_ALIASES = new Map([
  ["자동으로", "자동"],
  ["열리는", "열기"],
  ["열리던", "열기"],
  ["검증기", "검증"],
]);

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function meaningfulSearchTerms(query) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const meaningful = tokens
    .filter((token) => !CONVERSATIONAL_NOISE.has(token))
    .map((token) => SEARCH_TERM_ALIASES.get(token) || token);
  return meaningful.length ? meaningful : tokens;
}

export function matchesCoreSearch(query, values) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  const haystack = normalizeSearchText((values || []).flat().filter(Boolean).join(" "));
  if (haystack.includes(normalizedQuery)) return true;
  const terms = meaningfulSearchTerms(query);
  return terms.length > 0 && terms.every((term) => haystack.includes(term));
}

export function matchedSearchFields(query, fields) {
  const terms = meaningfulSearchTerms(query);
  return Object.entries(fields)
    .filter(([, value]) => {
      const normalized = normalizeSearchText(Array.isArray(value) ? value.join(" ") : value);
      return terms.some((term) => normalized.includes(term));
    })
    .map(([name]) => name);
}
