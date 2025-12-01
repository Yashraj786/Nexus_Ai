# DEPLOYMENT.md

This document outlines the process for deploying Nexus AI to a production environment.

## 1. Prerequisites

*   **Server:** A Linux-based server (e.g., Ubuntu, Debian) with Docker installed.
*   **Database:** PostgreSQL 14+ installed and accessible.
*   **Redis:** Redis 6+ installed and accessible.
*   **Ruby:** Ruby 3.3.x installed.
*   **Bundler:** Bundler installed.
*   **Git:** Git installed.
*   **Kamal (Optional):** If using Kamal for deployment, ensure it's installed and configured.

## 2. Environment Variables

Ensure the following environment variables are set in your production environment:

*   `RAILS_ENV=production`
*   `SECRET_KEY_BASE`: Generated using `rails secret`.
*   `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`).
*   `REDIS_URL`: Redis connection string (e.g., `redis://localhost:6379/1`).
*   `GOOGLE_API_KEY`: Your Google Gemini API key. Alternatively, configure this via Rails encrypted credentials.

## 3. Pre-Deployment Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Yashraj786/Nexus_Ai.git
    cd Nexus_Ai
    ```

2.  **Install Dependencies:**
    ```bash
    bundle install --deployment --without development test
    yarn install --production # If you're not using importmaps exclusively
    ```

3.  **Configure Rails Encrypted Credentials (if not using ENV vars for all secrets):**
    Ensure your `config/master.key` is securely transferred to the production server.
    ```bash
    EDITOR="code --wait" rails credentials:edit --environment production
    ```
    Add `google_api_key: YOUR_API_KEY` or any other secrets here.

## 4. Deployment Steps

1.  **Pull Latest Code:**
    ```bash
    git pull origin main # or your production branch
    ```

2.  **Database Migrations:**
    ```bash
    rails db:migrate
    ```

3.  **Asset Precompilation:**
    ```bash
    RAILS_ENV=production bundle exec rails assets:precompile
    ```

4.  **Restart Application:**
    Restart your web server (Puma, Passenger, etc.) and any background job workers (Solid Queue). The exact command depends on your server setup.
    *   **Example (Puma restart):** `sudo systemctl restart puma`
    *   **Example (Solid Queue restart):** `sudo systemctl restart solid_queue_worker`

## 5. Rollback Procedure

In case of a failed deployment, you can revert to the previous successful state:

1.  **Revert Code:**
    ```bash
    git revert HEAD # or git checkout <previous-commit-hash>
    ```

2.  **Rollback Database Migrations (if necessary):**
    ```bash
    rails db:rollback
    ```

3.  **Restart Application:**
    Restart your web server and background job workers.

## 6. Post-Deployment Smoke Test Checklist

After each deployment, verify the following:

*   **Health Check:** Access `/health` endpoint. It should return a `200 OK` status with details on DB, Redis, and AI API key status.
*   **Application Load:** Access the root URL (`/`). The login/signup page should load without errors.
*   **User Authentication:** Log in as an existing user.
*   **New Chat Session:** Create a new chat session.
*   **Send Message:** Send a message and verify an AI response is received.
*   **Feedback Submission:** Submit feedback from a chat session.
*   **Admin Dashboard (if applicable):** Access `/admin/dashboard` and verify metrics are displaying.
*   **Error Reporting:** (Optional) Intentionally trigger a 500 error and verify the custom error page and the "Report this error" functionality work.
*   **Log Files:** Check `log/production.log` and `log/api_events.log` for any unexpected errors.

---

This document should be kept up-to-date with your specific production environment and tooling.
