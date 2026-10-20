# model-orchestrator

`cc-switch`의 편리한 전환 기능을 유지하면서, 프로필을 안전하게 관리하는 작고 공급자 중립적인 CLI입니다.

## 왜 만들었나

- 설정 파일 형식이 공급자와 클라이언트마다 달라 전환 후에도 실제 동작 여부를 확인하기 어렵습니다.
- API 키가 목록이나 로그에 노출되기 쉽습니다.
- 전환이 파일을 직접 덮어쓰면 중단 시 설정이 깨질 수 있습니다.
- GUI 중심 흐름은 원격 개발 환경과 CI에서 재사용하기 어렵습니다.

## 개선 방향

- Claude, OpenAI, Gemini를 같은 프로필 모델로 관리
- `--dry-run`으로 적용 전 확인
- 비밀값 출력 자동 마스킹
- 임시 파일 후 원자적 교체
- CLI 중심이라 로컬, SSH, CI에서 동일하게 사용

## 사용

```bash
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js add work --provider openai --model gpt-5 --api-key "$OPENAI_API_KEY"
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js list
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js use work --dry-run
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js use work
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js current
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js health work
MODEL_ORCHESTRATOR_FILE=.profiles.json node src/cli.js env work
```

이 프로젝트는 각 코딩 도구의 설정을 무리하게 덮어쓰지 않고, 먼저 공통 프로필과 검증 계층을 제공하는 것을 목표로 합니다. 다음 단계는 provider별 health check와 Claude Code/Codex/Gemini CLI용 adapter입니다.

## License

MIT

## Trademark notice

This project is independent and is not affiliated with or endorsed by Anthropic, OpenAI, Google, or any other AI provider. Provider names are used only to describe compatibility.

