# Agent Guidelines for Nexus AI

## Build, Lint, and Test Commands

- **Full CI suite:** `bin/ci` - Runs setup, RuboCop, security audits, Rails tests, and system tests
- **Run all tests:** `bin/rails test`
- **Run single test file:** `bin/rails test test/models/chat_session_test.rb`
- **Run single test method:** `bin/rails test test/models/chat_session_test.rb:12`
- **Run system tests:** `bin/rails test:system`
- **Lint (RuboCop):** `bin/rubocop` or `bin/rubocop --fix` for auto-fixes
- **Security audits:** `bin/bundler-audit`, `bin/brakeman`, `bin/importmap audit`
- **Database seeds:** `env RAILS_ENV=test bin/rails db:seed:replant`

## Code Style Guidelines

### Ruby/Rails
- **Style:** Omakase Ruby (inherited from `rubocop-rails-omakase`)
- **Testing:** Minitest with Mocha mocking; use fixtures from `test/fixtures/`
- **Authorization:** Pundit for authorization policies in `app/policies/`
- **Imports:** Use standard Ruby/Rails conventions; avoid circular dependencies
- **Naming:** Snake_case for methods/variables, CamelCase for classes
- **Error Handling:** Rescue specific exceptions; return structured results `{ success:, content:, error: }`

### Frontend/JavaScript
- **Framework:** Stimulus (lightweight controllers) + Turbo (SPA features)
- **Build:** Vite with vite-ruby; output to `app/assets/builds`
- **CSS:** Tailwind via `config/tailwind.config.js`
- **Testing:** Playwright for E2E tests in `playwright/tests/`

### Database & Models
- **ORM:** Active Record; use concerns in `app/models/concerns/` for shared logic
- **Validations:** Define in model; include input sanitization (XSS prevention)
- **Jobs:** Active Job with SolidQueue; implement retry logic with exponential backoff

## Architecture Notes

- **AI Integration:** Layered approach: Controller → AiResponseJob → GenerateResponseService → GeminiClient
- **Observability:** Structured JSON logging to `log/api_events.log` via `ApiEventLogger`
- **Key Models:** ChatSession, Message, Persona, Feedback, AuditEvent
- **Background Jobs:** `AiResponseJob` handles async AI responses with retry mechanism (max 3 retries)
