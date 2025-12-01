# ARCHITECTURE.md

This document provides an overview of Nexus AI's architecture, focusing on its core components, AI integration, observability stack, and feature flagging system.

## 1. Core Components

*   **User Management:** Handled by Devise for authentication and user sessions. Users can create, manage, and delete their chat sessions.
*   **Chat Sessions (`ChatSession` model):** Represents a single conversation between a user and an AI persona. It manages messages, associated feedback, and audit events.
*   **Messages (`Message` model):** Stores individual messages within a chat session, including roles (user, assistant) and content. Includes input sanitization to prevent XSS.
*   **Personas (`Persona` model):** Defines different AI personalities with specific system instructions and visual attributes.
*   **Feedback (`Feedback` model):** Captures user-reported issues, suggestions, and feedback on chat sessions. Includes categorization (bug, performance, UX, etc.) and priority.
*   **Audit Events (`AuditEvent` model):** Provides a lightweight audit trail for key chat session actions (creation, export, feedback submission).

## 2. AI Integration Flow

The AI integration is managed through a layered approach:

1.  **`MessagesController`:** When a user sends a message, it's saved to the database, and an `AiResponseJob` is enqueued.
2.  **`AiResponseJob`:** This is a background job (`ActiveJob`) responsible for asynchronously generating AI responses.
    *   It fetches the `ChatSession` and its context (recent messages).
    *   It calls the `Ai::GenerateResponseService` to interact with the external AI provider.
    *   It implements a **robust retry mechanism with exponential backoff and jitter** to handle transient API failures gracefully. It attempts to retry up to 3 times with increasing delays before giving up.
    *   Upon successful response, it creates an assistant message and broadcasts it to the user via Action Cable.
    *   In case of persistent failure, it broadcasts an error message to the user, offering a retry option.
3.  **`Ai::GenerateResponseService`:** This service acts as an orchestrator for API calls.
    *   It builds the full conversation context, including the persona's system instruction.
    *   It calls the `Ai::GeminiClient` to make the actual HTTP request to the Google Gemini API.
    *   It handles API-specific errors and returns a structured `{ success: true/false, content: ..., error: ... }` result.
4.  **`Ai::GeminiClient`:** This is the low-level HTTP client responsible for communicating with the Google Gemini API.
    *   It manages API key fetching (from ENV or Rails credentials).
    *   It constructs API-specific payloads and parses responses.
    *   It provides a `api_key_configured?` class method for health checks.

## 3. Observability Stack

Nexus AI is built with observability as a first-class citizen:

*   **Structured Event Logging (`ApiEventLogger`):**
    *   A custom `ApiEventLogger` (configured in `config/initializers/api_event_logger.rb`) is used to log all critical events (API requests, job lifecycle, errors) in a structured JSON format to `log/api_events.log`.
    *   Each log entry includes metadata like `chat_session_id`, `user_id`, timestamps, and specific event types (`request_start`, `job_retry`, `job_success`, etc.).
*   **Admin Dashboard (`Admin::DashboardsController`):**
    *   An admin-only dashboard at `/admin/dashboard` parses `log/api_events.log` in real-time to display key metrics for the last 60 minutes.
    *   **Service Level Objectives (SLOs):** Tracks and visualizes two critical SLOs:
        *   **p95 Latency:** 95% of AI responses delivered under 3 seconds.
        *   **Success Rate:** 99.5% API success rate.
    *   Displays requests/min, failures/min, retries/min, average latency, and top error types.
    *   Includes feedback metrics: user-reported issues over 7 days and recent open incidents.
*   **Per-Session Analytics:**
    *   **Session Timeline:** Visualizes key lifecycle events (Started, First Reply, Last Reply, Feedback) directly on the chat session page.
    *   **Session Insights:** Displays basic session context (UUID, created_at, status) and a compact list of associated feedback.
    *   **Run Metrics:** Shows total messages, user/assistant message counts, and session duration.
*   **Audit Trail:** A lightweight, admin-only audit trail on each `chat_session` `show` page logs actions like session creation, export, and feedback submission, linking them to users and timestamps.

## 4. Feature Flagging System

A lightweight feature flagging system controls access to "Pro" analytics features:

*   **`User#feature_enabled?(feature_name)`:** A method in the `User` model checks if a specific feature is enabled for the current user.
*   **`User#features` (JSONB column):** Stores a hash of feature flags per user, allowing dynamic enabling/disabling of features.
*   **Environment-aware:** Features are automatically enabled in development environments and for admin users.
*   **Usage:** Advanced panels (Timeline, Insights, Run Metrics, Audit Trail) on the chat session page are wrapped in `feature_enabled?(:pro_session_analytics)` checks.

## 5. Error Experience & Reporting

*   **Custom Error Pages:** Implemented branded 404 (Not Found) and 500 (Internal Server Error) pages to provide a consistent and user-friendly experience.
*   **"Report this error" Hook:** On the 500 error page, authenticated users can click a button to automatically submit a bug report (`Feedback` entry) with relevant context (request URL, user, session ID if available).
*   **Error Notifier Service:** A `ErrorNotifierService` (for now, logging structured JSON) is called on 500 errors and user-reported bugs, providing a central point for integrating with external error tracking tools.

## 6. Deployment Considerations

*   **Health Check Endpoint (`/health`):** A dedicated endpoint checks database connectivity, Redis connectivity, and the presence of the AI API key, returning a `200 OK` if all services are healthy.
*   **Rails Configuration Hardening:** `config/environments/production.rb` is configured for production best practices (force SSL, info-level logging, asset compilation off, static file serving off).
*   **Secrets Management:** AI API keys and other sensitive data are managed via environment variables or Rails encrypted credentials, never hardcoded.

---
