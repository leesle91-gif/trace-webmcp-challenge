# TRACE — WebMCP Alpha

TRACE는 사용자가 하던 작업(Core)의 맥락 — 지금 상태, 확인된 결정, 다음 행동 — 을 저장해두고
나중에 다시 설명하지 않아도 이어갈 수 있게 하는 Work Memory 앱입니다.

이 저장소는 [The WebMCP Challenge](https://webmcp.devpost.com/) 제출을 위한 **공개 알파**입니다.
TRACE의 실제 검색 로직(`coreSearch.js`)을 그대로 가져와, 웹페이지 자체가
[WebMCP](https://github.com/webmachinelearning/webmcp) 표준으로 에이전트에게 도구를
직접 노출하도록 만들었습니다 — 별도 서버나 API 키 연동 없이, 페이지 안의
`document.modelContext.registerTool()` 호출만으로 동작합니다.

## 이 저장소가 아닌 것

- TRACE의 운영(상용) 서비스 코드가 아닙니다. 실제 TRACE는 별도 비공개 저장소에서 운영됩니다.
- 여기 담긴 Core 데이터는 전부 **가상의 테스트 데이터**입니다. 실제 사용자 데이터, 실제 계정,
  운영 DB는 전혀 사용하지 않습니다.
- 결제, 인증, 데스크톱 앱, 내부 운영 문서 등 이번 제출과 무관한 코드는 포함하지 않았습니다.

## 시나리오

1. 사용자가 "이사 계약서 준비하던 것 이어서 해줘"라고 말함
2. 에이전트가 `search_cores`로 관련 Core를 찾음
3. `get_core_context`로 저장된 결정·현재 상태·다음 행동을 복원함
4. 에이전트가 다음 행동을 제안하고, 사용자가 확인하면 `confirm_next_action`으로 반영함

에이전트가 임의로 다음 행동을 정하지 않고, 사용자 확인을 거친 것만 반영한다는 TRACE의
원래 제품 원칙을 그대로 따릅니다.

## 포함된 것 / 재사용된 실제 TRACE 코드

- `coreSearch.js` — TRACE 실제 저장소 `src/services/coreSearch.js`를 그대로 가져온 파일입니다
  (SHA-256 동일, 재구현 아님). 대화체 잡음 표현("아", "그거", "찾아줘" 등)을 걸러내고 일부
  활용형을 별칭으로 정규화하는 실제 검색 매칭 로직입니다. 조사(-을/를/이/가 등)를 형태소
  분석으로 제거하지는 않으므로, 검색어에 조사가 그대로 붙어 있으면(예: "계약서를") 저장된
  단어("계약서")와 다른 문자열로 취급되어 매칭되지 않을 수 있습니다 — 조사 없는 핵심 단어
  단위로 검색할 때 가장 잘 동작합니다.
- `data.js` — 가상 데모 Core 4개(테스트 데이터)와 로컬 저장(localStorage) 헬퍼.
- `app.js` — 화면 렌더링 + WebMCP 도구 3개 등록(`search_cores`, `get_core_context`,
  `confirm_next_action`).
- `index.html` — 페이지 뼈대.

## 설치 및 실행 방법

백엔드, 데이터베이스, 환경변수, 로그인이 전혀 필요 없습니다. 정적 파일만으로 동작합니다.

```bash
npm start
# 또는
npx serve .
```

브라우저에서 `http://localhost:4173`(또는 표시된 주소)을 엽니다.

## WebMCP 테스트 방법

- **일반 브라우저**: 그냥 페이지만 정상적으로 뜹니다(에이전트 도구 없이 사람이 클릭하는 용도).
  브라우저가 `document.modelContext`를 지원하지 않으면 하단 "에이전트 활동 로그"에 안내 문구가 뜹니다.
- **WebMCP 지원 브라우저 / ChatGPT 인앱 브라우저**: 페이지 로드 시 도구 3개가 자동 등록되고,
  에이전트가 도구를 호출하면 화면(Core 목록, 상세, 다음 행동)이 실시간으로 같이 바뀝니다.
- 개발자 콘솔에서 직접 확인하려면:
  ```js
  document.modelContext.getTools()
  ```

## 라이선스

[MIT](./LICENSE)
