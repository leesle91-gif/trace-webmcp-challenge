// 데모용 가짜 Core 데이터입니다. 실제 TRACE 사용자 데이터가 아닙니다.
const SEED_CORES = [
  {
    id: "move-2026",
    name: "이사 준비",
    summary: "새 집 계약서 검토와 입주 일정 조율",
    status: "새 집 계약서 검토 중, 입주일 협의 진행 중",
    decisions: [
      "보증금 5,000만원으로 확정",
      "입주일을 3월 15일 전후로 조율 중"
    ],
    nextAction: "부동산에 계약서 특약사항 재확인 연락하기",
    tags: ["이사", "계약", "부동산"]
  },
  {
    id: "cafe-2026",
    name: "카페 창업 준비",
    summary: "임대 매물 비교와 권리금 협상",
    status: "역세권 매물 2곳 실사 비교 중",
    decisions: [
      "역세권 위치를 최우선 조건으로 확정",
      "권리금 협상 여지가 있는 매물 위주로 압축"
    ],
    nextAction: "두 번째 매물 실사 일정 잡기",
    tags: ["창업", "카페", "임대"]
  },
  {
    id: "jeju-2026",
    name: "제주 여행 계획",
    summary: "4박 5일 일정과 숙소·렌터카 예약",
    status: "숙소·렌터카 예약 완료, 세부 일정 초안 작성 중",
    decisions: [
      "4박 5일 일정으로 확정",
      "렌터카 예약 완료(중형 SUV)"
    ],
    nextAction: "3일차 맛집 리스트 정리하기",
    tags: ["여행", "제주", "일정"]
  },
  {
    id: "job-2026",
    name: "이직 준비",
    summary: "이력서 업데이트와 면접 준비",
    status: "이력서 초안 완료, 포트폴리오 정리 중",
    decisions: [
      "지원 직군을 프로덕트 매니저로 좁힘",
      "추천서는 전 직장 팀장에게 요청하기로 함"
    ],
    nextAction: "포트폴리오에 최근 프로젝트 3개 요약 추가하기",
    tags: ["이직", "이력서", "커리어"]
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
