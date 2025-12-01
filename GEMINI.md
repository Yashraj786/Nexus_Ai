# GEMINI.md

## 1. Project Overview

Nexus AI is a production-ready, cyberpunk-themed AI chat application built with Ruby on Rails 8.1. It's designed to be a portfolio-quality project with a strong focus on stability, a feature-rich user experience, and robust observability.

The core of the application is a real-time chat interface where users can interact with different AI "personas." Each persona has a unique system instruction that guides the AI's behavior, allowing for a variety of conversational experiences.

## 2. Technology Stack

### Backend

- **Ruby:** 3.3.0
- **Rails:** 8.1.1
- **Database:** PostgreSQL
- **Cache:** Redis
- **Background Jobs:** Solid Queue (backed by Redis)
- **Web Server:** Puma
- **Authentication:** Devise
- **Authorization:** Pundit
- **AI Integration:** Google Gemini API (`gemini-ai` gem)

### Frontend

- **JavaScript Framework:** Hotwire (Turbo & Stimulus)
- **CSS Framework:** Tailwind CSS
- **Asset Pipeline:** Propshaft
- **Import Maps:** `importmap-rails`

### Deployment

- **Containerization:** Docker
- **Deployment Tool:** Kamal

## 3. System Architecture

### 3.1. Models

- **`User`:** Manages user accounts via Devise. Includes an `admin` flag for privileged access and a `features` JSONB column for feature flagging. It also tracks user onboarding progress.
- **`Persona`:** Defines the AI's personality, including its name, icon, and the crucial `system_instruction` that guides the AI's behavior.
- **`ChatSession`:** Represents a single conversation between a user and a persona. It has a title, and tracks when it was last active.
- **`Message`:** A single message in a chat session. It has a `role` (`user` or `assistant`) and `content`.
- **`Feedback`:** Allows users to submit feedback on chat sessions.
- **`AuditEvent`:** Logs significant user actions for administrative review (e.g., `created_session`, `exported_session`).
- **`CaptureLog`:** Captures and stores logs for debugging purposes.

### 3.2. Controllers

- **`PagesController`:** Handles static pages, including the main `nexus` landing page.
- **`ChatSessionsController`:** Manages the lifecycle of chat sessions (CRUD operations) and handles session-specific actions like exporting.
- **`MessagesController`:** Handles the creation of user messages and triggers the `AiResponseJob` to generate an AI response.
- **`Admin::DashboardsController`:** Provides a view for monitoring application metrics.
- **`HealthController`:** Exposes a `/health` endpoint to check the status of the database, Redis, and the AI API key.
- **`ErrorsController`:** Renders custom error pages (404 and 500).

### 3.3. Background Jobs

- **`AiResponseJob`:** The core job for generating AI responses. It calls the `Ai::GenerateResponseService` and includes a robust retry mechanism with exponential backoff to handle transient API errors.
- **`GenerateTitleJob`:** Asynchronously generates a title for a chat session after the second user message is sent.
- **`ExportChatSessionJob`:** Asynchronously generates a JSON export of a chat session.

### 3.4. Services

- **`Ai::GenerateResponseService`:** Encapsulates the logic for making calls to the Gemini API. It constructs the conversation context and handles the API request/response.
- **`DashboardService`:** Gathers and calculates metrics for the admin dashboard.
- **`ErrorNotifierService`:** A centralized service for reporting errors (placeholder for a service like Sentry or Bugsnag).

### 3.5. Frontend

The frontend is built with Hotwire, which allows for a single-page-app-like experience with server-rendered HTML.

- **Turbo:** Used for accelerating page navigation and form submissions.
- **Stimulus:** Used for client-side interactivity. The controllers are:
    - `app_launcher_controller.js`: Manages the "App Launcher" modal.
    - `chat_controller.js`: Handles the chat interface, including message submission and real-time updates.
    - `clipboard_controller.js`: Provides copy-to-clipboard functionality.
    - `onboarding_controller.js`: Manages the user onboarding checklist.
    - `sidebar_controller.js`: Controls the behavior of the sidebar.
- **Tailwind CSS:** Used for styling the application.

## 4. Core Functionality

### 4.1. Multi-Persona System

Users can start chat sessions with different AI personas. Each persona has a `system_instruction` that is passed to the Gemini API, which then guides the AI's personality and responses.

### 4.2. Real-Time Chat

The chat interface is updated in real-time using Action Cable. When a user sends a message, an `AiResponseJob` is triggered. Once the job is complete, the AI's response is broadcast back to the user's browser via a Turbo Stream.

### 4.3. Smart Titles

After the second user message in a new chat session, a `GenerateTitleJob` is enqueued. This job uses the Gemini API to generate a concise and relevant title for the chat session based on the conversation so far.

### 4.4. Session Export

Users can export their chat sessions as a JSON file. This is handled by the `ExportChatSessionJob`, which generates the JSON file and makes it available for download.

## 5. Development Environment Setup

### 5.1. Prerequisites

- Ruby 3.3.0
- Node.js & Yarn
- PostgreSQL

### 5.2. Installation

1.  Clone the repository.
2.  Install Ruby dependencies: `bundle install`
3.  Install JavaScript dependencies: `yarn install`
4.  Create the database: `bin/rails db:create`
5.  Run database migrations: `bin/rails db:migrate`

### 5.3. Running the Application

- **Start the Rails server:** `bin/rails server`
- **Start the Tailwind CSS watcher:** `./node_modules/.bin/tailwindcss -i ./app/assets/tailwind/application.css -o ./app/assets/builds/tailwind.css --watch`

## 6. Testing

### 6.1. Running Tests

- **Run all tests:** `bin/rails test`
- **Run system tests:** `bin/rails test:system`

### 6.2. Testing Philosophy

The project uses a standard Rails testing structure, with unit tests for models, functional tests for controllers, and system tests for user-facing workflows.

## 7. Deployment

### 7.1. Kamal Deployment

This project is deployed using [Kamal](https://kamal-deploy.org/). The deployment configuration is in `config/deploy.yml`.

- **Setup Kamal:** `kamal setup`
- **Deploy:** `kamal deploy`

### 7.2. Environment Variables

The application uses `config/credentials.yml.enc` to store secrets. To edit the credentials, use `bin/rails credentials:edit`.

For production, the `RAILS_MASTER_KEY` environment variable must be set. Other environment variables may be required for services like Redis, etc., as specified in `config/deploy.yml`.

## 8. CI/CD

The project uses GitHub Actions for Continuous Integration. The workflow is defined in `.github/workflows/ci.yml`. The pipeline runs on every push to `master` and on every pull request.

The CI pipeline includes jobs for:
- Security scanning (Brakeman and bundler-audit)
- Linting (RuboCop)
- Running the test suite (unit and system tests)

## 9. Observability & Monitoring

### 9.1. Admin Dashboard

An admin dashboard is available at `/admin/dashboard`. It provides insights into the application's performance, including SLOs like p95 latency and success rate of AI response jobs.

### 9.2. Structured Logging

The application uses a custom `ApiEventLogger` to write structured JSON events to `log/api_events.log`. This allows for detailed analysis of job performance, API calls, and errors.

### 9.3. Error Tracking

The `ErrorNotifierService` is a placeholder for a production-grade error tracking service like Sentry or Bugsnag.

## 10. Contributing

Contributions are welcome! Please read the [contribution guidelines](CONTRIBUTING.md) for more information.

## 11. Key Files

- **`PROJECT_BLUEPRINT.md`:** The high-level technical overview of the project.
- **`config/routes.rb`:** Defines all the application's routes.
- **`Gemfile`:** Lists all the project's Ruby dependencies.
- **`config/deploy.yml`:** The deployment configuration for Kamal.
- **`.github/workflows/ci.yml`:** The GitHub Actions workflow for CI.
- **`app/jobs/ai_response_job.rb`:** The core background job for generating AI responses.
- **`app/services/ai/generate_response_service.rb`:** The service that interacts with the Gemini API.
- **`app/views/layouts/application.html.erb`:** The main application layout.