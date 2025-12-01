# TROUBLESHOOTING.md

This document provides solutions to common issues encountered when running and developing Nexus AI.

## 1. Common Errors

### `ActiveRecord::PendingMigrationError`

**Problem:** You see this error when starting the Rails server or accessing a page, indicating that there are unapplied database migrations.
**Solution:** Run `rails db:migrate` to apply all pending migrations.
```bash
rails db:migrate
```

### `PG::DatatypeMismatch` or `PG::UndefinedColumn` during migrations

**Problem:** Database migration fails due to mismatched column types (e.g., trying to assign `uuid` to `bigint`) or a column not existing during a rollback.
**Solution:**
1.  **Identify the problematic migration:** Check the error message for the migration file name.
2.  **Inspect `db/schema.rb`:** Verify existing column types and indexes.
3.  **Correct the migration file:** Ensure `type: :uuid` is used for UUID foreign keys (e.g., `t.references :user, type: :uuid, foreign_key: true`). Ensure `up` and `down` methods correctly handle column renames/changes if applicable.
4.  **Rollback (if necessary):** If the migration partially applied, you might need to rollback. Use `rails db:migrate:down VERSION=YYYYMMDDHHMMSS` for the problematic migration, then correct it and run `rails db:migrate`.

### `ArgumentError (wrong number of arguments (given 0, expected 1..2))` in model with `enum`

**Problem:** The application fails to load with this error pointing to an `enum` definition in a model.
**Solution:** This usually means the `enum` macro is being called incorrectly.
1.  **Check `enum` syntax:** Ensure the `enum` keyword and its hash definition are on the same logical line.
2.  **Check for `enum` shadowing:** Search your codebase (`app/` directory) for any other `def enum` method definitions that might be conflicting with `ActiveRecord::Enum`. If found, rename your custom method.
3.  **Explicit namespacing:** If conflicts persist, you can try `ActiveRecord::Base.enum ...` but this is rarely necessary if the above are addressed.

### `ActionView::Template::Error (undefined method 'priorities' for class 'Feedback')`

**Problem:** The view is trying to call `Feedback.priorities` but the method does not exist.
**Solution:** Ensure the enum name in the model matches the method call in the view. If you renamed the enum (e.g., to `feedback_priority`), update the view to `Feedback.feedback_priorities`.

### 404 errors for JavaScript assets (`/assets/controllers/...`, `/assets/channels/...`)

**Problem:** JavaScript assets are not loading, leading to non-functional Stimulus controllers or Action Cable. This usually indicates a conflict between the asset pipeline and importmaps.
**Solution:**
1.  **Verify `app/views/layouts/application.html.erb`:** Ensure only `javascript_importmap_tags` is present and no `javascript_include_tag` references legacy assets.
2.  **Check `app/assets/javascripts/application.js`:** This file (if it exists) should not contain `//= require` directives for `controllers` or `channels`. If it's empty or only contains such directives, consider deleting it.
3.  **Confirm `config/importmap.rb`:** Ensure `pin_all_from "app/javascript/controllers", under: "controllers"` and `pin_all_from "app/javascript/channels", under: "channels"` are correctly defined.
4.  **Verify `app/javascript/application.js`:** Should `import "controllers"` and `import "channels"`.
5.  **Verify `app/javascript/controllers/index.js` and `app/javascript/channels/index.js`:** Ensure they use `eagerLoadControllersFrom` and correctly import specific channel files respectively.

## 2. AI API Issues

### "AI API is slow/timing out" or "Rate limit exceeded"

**Problem:** User messages take a long time to get a response, or the AI returns errors related to slowness or rate limits.
**Solution:**
1.  **Check Admin Dashboard (`/admin/dashboard`):** Look at "p95 Latency," "Success Rate," and "Top Error Types." This will show if there's a system-wide issue with the AI provider.
2.  **Review `log/api_events.log`:** This structured log contains detailed information about each API request, including latency and errors. Look for `request_error` events.
3.  **Verify API Key:** Ensure your `GOOGLE_API_KEY` is correct and hasn't been revoked.

### "Could not extract content from API response"

**Problem:** The AI API returns a successful status code, but the application fails to parse the response content.
**Solution:**
1.  **Review `log/api_events.log`:** Look for `request_error` events with `error: "InvalidResponse"` or `error: "JSON::ParserError"`.
2.  **Inspect the raw API response:** If possible, enable more detailed logging in `Ai::GeminiClient` temporarily to see the full body of the problematic API response. This might indicate a change in the API's response format.

## 3. General Development Issues

### `N+1` Queries detected by Bullet

**Problem:** Loading a page triggers many redundant database queries, slowing down the application.
**Solution:**
1.  **Identify N+1 culprit:** Bullet gem (if enabled in development) will alert you in the browser console or Rails logs.
2.  **Add `includes` or `eager_load`:** In your controller actions or model scopes, use `includes(:association)` or `eager_load(:association)` to pre-load associated records, reducing the number of database queries.
3.  **Add database indexes:** Ensure foreign keys, `created_at`, `updated_at`, and other frequently queried columns have database indexes.

### Health Check Failing (`/health` returns 503)

**Problem:** The `/health` endpoint indicates a service is unavailable (database, Redis, or AI API key).
**Solution:**
1.  **Check `HealthController` logs:** The `HealthController` logs specific failures (e.g., 'Database connection failed', 'Redis connection failed').
2.  **Verify service status:** Ensure your database, Redis, and internet connection are active and accessible.
3.  **Check Environment Variables:** Confirm `DATABASE_URL`, `REDIS_URL`, and `GOOGLE_API_KEY` are correctly set in your environment.
