# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

Nexus AI is a Rails 8 application that provides a multi-persona conversational AI experience. It emphasizes production readiness: background job–driven AI calls, robust error handling, structured logging for observability, an admin SLO dashboard, and a built-in feedback loop.

## Core commands

### Environment & setup

- Initial setup (installs gems, prepares DB, clears logs, and starts the dev server unless skipped):
  - `bin/setup`
  - Non-interactive setup without starting the server: `bin/setup --skip-server`
- Install JS dependencies (if not already installed):
  - `yarn install` (or `npm install`)
- Database prepare/reset:
  - `bin/rails db:prepare` (create + migrate for current environment)
  - `bin/rails db:reset` (drop, create, migrate, seed; use carefully)

### Local development

- Start the full dev environment (Rails server + Tailwind watcher via Foreman):
  - `./bin/dev`
- Start just the Rails server (without Tailwind watcher):
  - `bin/rails server`
- Tailwind CSS watcher (normally handled by `bin/dev`, exposed via `Procfile.dev`):
  - `./node_modules/.bin/tailwindcss -i ./app/assets/tailwind/application.css -o ./app/assets/builds/tailwind.css --watch`

### Testing

Rails tests are Minitest-based and live under `test/` (models, controllers, jobs, services, policies, and system tests).

- Run the full test suite:
  - `bin/rails test`
- Run only system tests (e2e/regression flows):
  - `bin/rails test:system`
- Example: run tests for a single file:
  - `bin/rails test test/models/message_test.rb`
  - `bin/rails test test/services/ai/generate_response_service_test.rb`
- Example: run a single test by line number:
  - `bin/rails test test/system/regression_test.rb:42`
- Rebuild the test DB and reseed (used in CI and useful locally when fixtures/seeds change):
  - `env RAILS_ENV=test bin/rails db:seed:replant`

### Linting & security checks

These commands are wired into CI and should be kept passing when changing core logic.

- Ruby style (Rubocop, using `rubocop-rails-omakase` config):
  - `bin/rubocop`
- Rails security static analysis (Brakeman):
  - `bin/brakeman`
- Gem vulnerability audit (Bundler Audit, configured via `config/bundler-audit.yml`):
  - `bin/bundler-audit`
- Importmap JS dependency audit:
  - `bin/importmap audit`

### CI orchestration

There is a cohesive CI entrypoint that runs setup, linters, security checks, and tests in sequence.

- End-to-end CI run (mirrors `.github/workflows/ci.yml` and `config/ci.rb`):
  - `bin/ci`

### Build / deployment-related

See `DEPLOYMENT_GUIDE.md` for full details; the most relevant commands are:

- Precompile assets for production:
  - `RAILS_ENV=production bin/rails assets:precompile`
- Production database setup:
  - `RAILS_ENV=production bin/rails db:create db:migrate`
- Background job worker using Solid Queue (production):
  - `RAILS_ENV=production bin/rails solid_queue:start`
- Docker image build & run (simplified):
  - `docker build -t nexus-ai .`
  - `docker run -p 3000:3000 nexus-ai`

## Configuration notes

- AI provider: Google Gemini (via `gemini-1.5-flash`), configured through either `GOOGLE_API_KEY` env var or Rails encrypted credentials.
- For local development, README assumes editing credentials:
  - `EDITOR="code --wait" bin/rails credentials:edit`
  - Add: `google_api_key: YOUR_API_KEY`
- Production deployment typically uses `google.api_key` nested under `google:` in credentials or the `GOOGLE_API_KEY` environment variable, as used by `Ai::GeminiClient`.

## Architecture overview

### Domain model

- **User** (`app/models/user.rb`): Devise-authenticated user, owner of all chat data and feedback.
- **Persona** (`app/models/persona.rb`): Defines AI personas (name, system instruction, icon, color). Provides `Persona.cached_all` for cached retrieval and display helpers (`display_icon`, `display_color`).
- **ChatSession** (`app/models/chat_session.rb`): Core conversation aggregate; belongs to a user and persona, and has many messages, feedbacks, and audit events.
  - Tracks activity via `last_active_at`, memoized `context_window` for recent messages, smart-title generation, and convenience metrics (`run_metrics`, `timeline`).
- **Message** (`app/models/message.rb`): Individual chat messages with a `role` enum (`user`, `assistant`, `system_instruction`), counter-cached on `chat_sessions` and responsible for sanitizing user content.
- **Feedback** (`app/models/feedback.rb`): User feedback on a specific chat session, categorized and prioritized via enums; optionally triggers error notifications when flagged as a bug.
- **AuditEvent** (`app/models/audit_event.rb`): Lightweight audit log tied to a user and chat session, used for tracking sensitive operations (exports, feedback creation, etc.).

The domain is intentionally centered around `ChatSession` as the aggregate root, with `Persona` as configuration and `Message`, `Feedback`, `AuditEvent` as associated records.

### Request flow & chat lifecycle

- **ChatSessionsController** (`app/controllers/chat_sessions_controller.rb`):
  - `index`: uses `policy_scope(ChatSession)` with eager-loading of personas for the sidebar/session list.
  - `show`: enforces authorization, ensures the session is structurally sound, and loads messages and feedbacks with eager-loading to avoid N+1 queries.
  - `create`: binds a selected `Persona` to a new `ChatSession`, logs an audit event, and updates onboarding state.
  - `export`: streams a JSON representation of a session (including messages and feedbacks) and logs an `AuditEvent`.
- **MessagesController** (`app/controllers/messages_controller.rb`):
  - `create`: builds a `Message` for the current user’s session, authorizes via `MessagePolicy`, saves, enqueues `AiResponseJob`, and immediately broadcasts the user message via `ActionCable`.
  - `retry`: allows re-enqueuing of `AiResponseJob` for a given message, gated by `MessagePolicy#retry?`.
- **FeedbacksController** (`app/controllers/feedbacks_controller.rb`):
  - Creates feedback entries attached to sessions, captures a snapshot of recent API events from `log/api_events.log`, logs audit events, and optionally notifies via `ErrorNotifierService` when feedback is a bug.

Overall chat flow: a user creates a `ChatSession` → posts `Message` records → each user message enqueues `AiResponseJob` → assistant responses are created asynchronously and pushed to the client via websockets.

### Background jobs & real-time delivery

- **AiResponseJob** (`app/jobs/ai_response_job.rb`):
  - Pulls the triggering user message and associated `ChatSession`.
  - Calls `Ai::GenerateResponseService` and, on success, persists a new assistant `Message` and broadcasts it over `ChatChannel`.
  - Implements manual retry with exponential backoff and jitter, broadcasting `is_retrying` states to the client and logging each attempt and terminal failure via `ApiEventLogger`.
  - Handles missing messages gracefully (`ActiveRecord::RecordNotFound`) and logs via `ApiEventLogger` instead of raising.
- **ChatChannel** (`app/channels/chat_channel.rb`):
  - Streams from `"chat_session_#{params[:chat_session_id]}"` so all job and controller broadcasts for a session converge on a single topic.

In production, background jobs are processed via **Solid Queue** (`config/environments/production.rb`), configured to use a separate queue database connection. Development uses an inline adapter for simplicity; long-running or production-like behavior is validated in production or CI.

### AI integration layer

The AI integration is deliberately factored into a service layer under `app/services/ai`:

- **Ai::GenerateResponseService** (`app/services/ai/generate_response_service.rb`):
  - High-level orchestrator invoked by `AiResponseJob`.
  - Validates prerequisites (non-nil session, persona presence, API key presence).
  - Builds a full Gemini context by combining persona instructions, a synthetic initial model acknowledgment, and the session’s `context_window` (converted via `Message#to_gemini_format`).
  - Sends the request and normalizes responses to a simple hash contract: `{ success: true, content: ... }` or `{ success: false, error: ... }`.
  - Emits structured events (`request_start`, `request_end`, `request_error`) via `ApiEventLogger` with latency and outcome for SLO tracking.
- **Ai::GeminiClient** (`app/services/ai/gemini_client.rb`):
  - Low-level HTTP client for Gemini, responsible for building the payload (generation config and safety settings), handling timeouts, and mapping HTTP status codes to friendly error messages.
  - Retrieves API keys from env (`GOOGLE_API_KEY`) or credentials (`google.api_key`), raises on missing keys, and logs unexpected errors to `Rails.logger` with a standardized error shape.

This separation lets `AiResponseJob` and controllers depend only on a stable service contract without coupling to HTTP details.

### Observability & admin dashboard

Observability is built around structured logs rather than bespoke metrics infrastructure.

- **ApiEventLogger** (`config/initializers/api_event_logger.rb`):
  - Writes JSON lines into `log/api_events.log` with a `timestamp`, `event` name, and arbitrary data.
  - Used heavily in `AiResponseJob` and `Ai::GenerateResponseService` to record request lifecycle and retry behavior.
- **DashboardService** (`app/services/dashboard_service.rb`):
  - Reads `log/api_events.log` within a recent time window to compute request volumes, failures, retries, latency statistics (including p95), and top error types.
  - Defines explicit SLO thresholds (p95 latency and success rate) and returns pass/fail flags.
  - Augments metrics with feedback data (recent user-reported issues, a small set of recent feedback records).
- **Admin::DashboardsController** (`app/controllers/admin/dashboards_controller.rb`):
  - Restricts access to admin users only and exposes `@metrics = DashboardService.call` to the `/admin/dashboard` view.

The `help/case_study` view documents these mechanisms and how they are used during beta testing to validate stability and observability.

### Feedback and error handling

- **Feedback pipeline**:
  - `FeedbacksController` associates each feedback with a `ChatSession` and `User`, captures a bounded snapshot of recent API events for context, and logs audit events.
  - `Feedback` enums (`category`, `priority`) provide a structured way to triage user reports in the admin inbox.
- **ErrorNotifierService** (`app/services/error_notifier_service.rb`):
  - Central place to log structured error information (error type, message, partial backtrace, user, and request params), ready to be swapped out for a third-party error tracker.
- **ErrorsController** (`app/controllers/errors_controller.rb`):
  - Handles 404 and 500 error endpoints, invoking `ErrorNotifierService` for internal errors.

### Security & authorization

Security is enforced at several layers beyond Devise authentication.

- **Pundit policies** (`app/policies`):
  - `ApplicationPolicy` provides conservative defaults and a base `Scope` abstraction.
  - `ChatSessionPolicy` ensures users can only access and mutate their own chat sessions, and scopes queries accordingly.
  - `MessagePolicy` gates creation, retry, and deletion of messages to sessions owned by the current user and denies arbitrary updates to preserve an audit trail.
- **Rate limiting with Rack::Attack** (`config/initializers/rack_attack.rb`):
  - Throttles message creation, login attempts, and general requests per IP.
  - Safelists localhost in development and provides a custom HTML response and logging for throttled requests.
- **Content sanitization** (`Message#sanitize_content`):
  - Strips all HTML tags and non-printable/control characters, marks messages as sanitized, and updates the stored content.
- **Production job and logging configuration** (`config/environments/production.rb`):
  - Uses Solid Queue for `ActiveJob`, logs to STDOUT with tagged logging, and includes hooks for SSL and host protection.

## How to work effectively in this codebase

- When changing AI behavior, prefer updating `Ai::GenerateResponseService` and `Ai::GeminiClient` rather than scattering HTTP logic in controllers or jobs.
- When adding new user-facing operations or admin tools, route them through appropriate Pundit policies and, where relevant, create corresponding `AuditEvent` entries for traceability.
- For features that might impact SLOs (latency, error rates), ensure they integrate with `ApiEventLogger` and that `DashboardService` exposes any new metrics needed by `/admin/dashboard`.
- For new security-sensitive endpoints, consider both Pundit policies and Rack::Attack throttles, mirroring the existing patterns for messages and login attempts.
