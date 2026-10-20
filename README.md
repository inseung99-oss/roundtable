# Roundtable · 원탁

다른 생각, 하나의 대화. **GPT와 Claude**의 의견을 나란히 비교하고, 한 의견을 다른 AI에게 전달하거나 기록에 내 생각을 더하는 대화 워크스페이스입니다.

**[원탁 바로 사용하기](https://roundtable-ai-dialogue.inseung99.chatgpt.site)** · [AI 연결 안내](CONNECTOR-GUIDE.md)

## 주요 기능

- 발의자 메시지와 AI별 비교 카드, 대화 목록, 참가자 패널
- 기본 AI: GPT · Claude
- 참가자 추가에서 Gemini · Grok을 선택하거나 다른 AI를 직접 등록
- 전체 AI에 보내기, 의견 전달, 기록 후 내 의견 덧붙이기
- 대화방 생성·수정, JSON 백업 내보내기·가져오기
- 로그인 사용자의 서버 동기화, 충돌 감지, 계정별 브라우저 백업
- 인증된 REST API와 MCP 요청·답변 처리
- 좁은 화면에서는 카드가 세로로 정렬되는 반응형 UI

**AI 참가자 등록만으로 실제 모델이 연결되지는 않습니다.** 예시 모드는 미리 작성한 응답으로 동작하며, 실제 답변에는 AI 클라이언트의 MCP 연결 또는 별도의 연결 프로그램이 필요합니다. 연결 대기 모드에는 자동 모델 호출이나 API 사용료 결제 기능이 없습니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다. 아래 실행에는 외부 패키지 설치가 필요하지 않습니다.

```sh
git clone https://github.com/inseung99-oss/roundtable.git
cd roundtable
node preview-server.mjs
```

브라우저에서 `http://127.0.0.1:4175`를 여세요. 로컬 미리보기는 개발용 계정과 메모리 데이터베이스를 사용하므로 종료 시 서버 데이터가 초기화됩니다. 브라우저 백업은 남습니다.

```sh
node --test tests/core.test.mjs tests/server.test.mjs
node build-static.mjs
```

정적 빌드 결과는 `dist/`입니다. 정적 서버에서는 브라우저 백업과 예시 모드를 이용할 수 있고 서버 동기화와 MCP는 제공되지 않습니다.

## 서버 배포

실제 서비스는 Cloudflare Workers 호환 서버와 D1 데이터베이스를 사용합니다. `drizzle/0000_roundtable.sql`을 적용하고 DB를 `DB` 이름으로 바인딩합니다.

Sites로 별도 배포할 경우 본인 프로젝트에서 발급받은 `.openai/hosting.json`을 사용하고 `node build-server.mjs`를 실행하세요. 이 저장소에는 원본 사이트의 호스팅 ID, 사용자 대화, API 키를 포함하지 않습니다.

인증 사용자 ID는 신뢰할 수 있는 호스팅 인증 계층에서 주입하는 `oai-authenticated-user-id` 헤더로 식별합니다. 다른 호스팅으로 옮길 경우 이 헤더를 외부 요청에서 제거하고, 검증된 로그인 결과만 주입하는 인증 계층이 반드시 필요합니다. `preview-server.mjs`는 로컬 전용이므로 인터넷 서비스에 사용하지 마세요.

공개 사이트에서도 개인 대화 조회·수정·AI 답변 API는 로그인 사용자별로 분리됩니다. 비로그인 방문자는 예시를 확인하고 자신의 브라우저에 대화를 보관할 수 있습니다. 로그인 전 작성한 내용은 먼저 내보낸 뒤, 필요한 경우 로그인 후 가져오세요.

## 소스 구성

| 경로 | 역할 |
| --- | --- |
| `ui/` | 화면, 카드 레이아웃, 대화 동작 |
| `server/handler.mjs` | 사용자별 저장 및 REST/MCP 처리 |
| `drizzle/` | D1 데이터베이스 스키마 |
| `tests/` | 전달, 백업, 요청 처리, 계정 격리 검증 |
| `build-static.mjs` | 브라우저 전용 정적 빌드 |
| `build-server.mjs` | 서버 포함 Worker 빌드 |

이 저장소는 실제 사용되는 원탁 구현을 담고 있습니다. 사용하지 않는 초기 프레임워크 스캐폴드와 호스팅 도구의 로컬 상태는 제외했습니다.

## 기여

누구나 소스를 열람하고 포크할 수 있습니다. 개선 제안이나 오류는 Issues로, 수정은 Pull Request로 보내 주세요. API 키나 개인 대화 백업은 커밋하지 마세요.
