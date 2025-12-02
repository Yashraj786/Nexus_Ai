# Nexus AI - UI Optimization Checklist

## Priority 1: CRITICAL (High ROI, Low Effort)

### 1.1 Refactor Settings Page
- [ ] Create `app/views/settings/_api_configuration.html.erb` (lines 45-105)
- [ ] Create `app/views/settings/_fallback_provider.html.erb` (lines 132-209)
- [ ] Create `app/views/settings/_usage_analytics.html.erb` (lines 212-285)
- [ ] Create `app/views/settings/_rate_limits.html.erb` (lines 287-344)
- [ ] Move inline JavaScript to `settings_controller.js`
- [ ] Update settings/show.html.erb to render 4 partials
- **Expected:** 381 lines → ~50 lines in main file
- **Effort:** 1-2 hours
- **Impact:** Improved maintainability, easier testing

### 1.2 Icon System Optimization
- [ ] Create SVG sprite sheet from all Lucide icons (44 total)
  - zap, shield, bar-chart-2, lock, users, trending-up, check-circle,
    alert-circle, info, save, external-link, trash-2, arrow-left, arrow-up,
    message-square, loader, etc.
- [ ] Replace all `<i data-lucide="...">` with `<svg><use>` references
- [ ] Update tailwind.config.js to remove lucide icon styling
- [ ] Delete lucide library from dependencies if no longer needed
- **Expected:** Reduced 44 icon initializations → 1 sprite load
- **Effort:** 1-1.5 hours
- **Impact:** ~10% load time reduction, fewer DOM queries

### 1.3 Add Export Polling Safeguards
- [ ] Update `chat_controller.js` line 201-247 (`pollExportStatus`)
  - Add `maxAttempts = 20` counter
  - Add exponential backoff: `delay = 2000 * Math.pow(2, attemptCount / 5)`
  - Clear interval on successful completion
  - Clear interval and show error after max attempts
- [ ] Add timeout guard: 5 minute total timeout
- **Effort:** 30 minutes
- **Impact:** Prevent memory leaks, better UX

### 1.4 Add Loading States to Dashboard
- [ ] Add skeleton loaders to `admin/dashboards/show.html.erb`
  - Wrap metrics in `<div class="animate-pulse">`
  - Replace content with gray placeholder blocks
- [ ] Show spinners while metrics load
- [ ] Cache metrics with 5-minute Redis TTL
- **Effort:** 45 minutes
- **Impact:** Better perceived performance

---

## Priority 2: HIGH (Medium ROI, Medium Effort)

### 2.1 Implement Virtual Scrolling for Chat Messages
- [ ] Install `@hotwired/stimulus-virtual-scroll` or create custom solution
- [ ] Update `chat_sessions/show.html.erb`:
  - Limit initial render to last 50 messages
  - Load older messages on scroll up
  - Load newer messages on scroll down
- [ ] Update `ChatController` to handle `loadMore` actions
- **Expected:** Reduce DOM nodes from 200+ → 50
- **Effort:** 3-4 hours
- **Impact:** 30-40% faster chat load time for long sessions

### 2.2 Add Image Lazy Loading
- [ ] Add `loading="lazy"` to all `<img>` tags in views
  - Check `pages/nexus.html.erb`
  - Check `admin/dashboards/show.html.erb`
  - Check message content rendering
- [ ] Use `decoding="async"` for non-critical images
- **Effort:** 30 minutes
- **Impact:** Faster initial page load

### 2.3 Extract Shared Form Patterns
- [ ] Create `app/helpers/form_helper.rb`:
  - `render_api_key_input(form, field_name)`
  - `render_model_select(form, provider)`
  - `render_provider_links`
- [ ] Replace duplicated form code in settings partial
- [ ] Use in fallback provider section
- **Effort:** 1 hour
- **Impact:** DRY principle, easier maintenance

### 2.4 Add Pagination to Data Tables
- [ ] Update `_usage_analytics.html.erb` (line 242-273):
  - Add Kaminari pagination gem
  - Paginate @recent_logs (default 10 per page)
  - Add AJAX loader for page switching
- [ ] Update `admin/dashboards/show.html.erb`:
  - Paginate @metrics[:open_incidents]
  - Paginate top_error_types
- **Effort:** 1.5 hours
- **Impact:** Better UX for large data sets

---

## Priority 3: MEDIUM (Lower ROI, Higher Effort)

### 3.1 Refactor Chat Message Rendering
- [ ] Consider moving to JavaScript component:
  - Create `app/javascript/components/ChatMessage.js`
  - Render messages with Stimulus controller
  - Keep ActionCable for real-time updates
- [ ] Implement markdown rendering in JS (markdown-it)
- [ ] Add message editing UI
- [ ] Add copy-to-clipboard for individual messages
- **Effort:** 4-6 hours
- **Impact:** Better interactivity, easier to extend

### 3.2 Implement Server-Sent Events (SSE)
- [ ] Replace ActionCable with SSE for chat streaming:
  - Create `app/controllers/chat_sessions/sse_controller.rb`
  - Lower memory overhead vs WebSocket
  - Better for one-way server-to-client updates
- [ ] Keep Turbo Drive for form submission
- **Effort:** 4 hours
- **Impact:** ~15% memory reduction on server

### 3.3 Extract Stimulus Controllers
- [ ] Split `chat_controller.js` (250 lines):
  - `export_controller.js` - Handle export & polling
  - `message_retry_controller.js` - Handle retry logic
  - `input_controller.js` - Handle textarea resizing
  - Leaves `chat_controller.js` as orchestrator
- **Effort:** 2 hours
- **Impact:** Better code organization, easier testing

---

## Priority 4: LOW (Maintenance & Future-Proofing)

### 4.1 Add Service Worker
- [ ] Create `app/javascript/service-worker.js`
- [ ] Implement offline message caching
- [ ] Cache static assets for faster repeat loads
- **Effort:** 2-3 hours
- **Impact:** Offline capability

### 4.2 Implement Code Splitting
- [ ] Admin dashboard on separate bundle
- [ ] Chat interface on main bundle
- [ ] Lazy load help pages
- **Effort:** 2-3 hours
- **Impact:** Smaller initial JS download

### 4.3 CSS Audit & Purge
- [ ] Run Tailwind CSS analyzer
- [ ] Check for unused utilities
- [ ] Remove duplicate class definitions
- **Effort:** 30 minutes
- **Impact:** Potential 2-5% CSS size reduction

### 4.4 Performance Monitoring
- [ ] Add Web Vitals tracking
- [ ] Implement Sentry for error tracking
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)
- **Effort:** 1 hour setup
- **Impact:** Ongoing performance insight

---

## Quick Wins Implementation Order

For maximum impact with minimum effort, implement in this order:

1. **Week 1:**
   - [ ] Settings page refactor (1-2 hours) → 8 story points
   - [ ] Icon system optimization (1-1.5 hours) → 5 story points
   - [ ] Export polling safeguards (30 min) → 3 story points
   - **Total: 3 hours, 16 story points**

2. **Week 2:**
   - [ ] Loading states (45 min) → 4 story points
   - [ ] Lazy loading (30 min) → 2 story points
   - [ ] Form helpers (1 hour) → 4 story points
   - **Total: 2.25 hours, 10 story points**

3. **Week 3-4:**
   - [ ] Virtual scrolling (3-4 hours) → 13 story points
   - [ ] Pagination (1.5 hours) → 5 story points
   - [ ] Chat controller split (2 hours) → 8 story points

---

## Monitoring & Metrics

### Before Optimization
- JS Bundle: 4.0 KB (good)
- CSS Bundle: 27 KB (good)
- Average View Size: 228 KB total / 48 files = 4.75 KB/file
- Max View Size: 381 lines (settings)
- Settings page load: ~500ms (estimate with 40 form inputs)
- Chat with 500 messages: Render all 500 DOM nodes

### Target After Optimization
- JS Bundle: <5 KB (maintain or reduce with code splitting)
- CSS Bundle: <25 KB (potential 2-5% reduction)
- Average View Size: <4 KB/file
- Max View Size: <100 lines per file
- Settings page load: <300ms (with async metrics)
- Chat with 500 messages: Render 50 visible + virtual scroll
- Settings page Lighthouse: 85+ (from 65)
- Chat page Lighthouse: 80+ (from 60)

---

## Testing Checklist

After each optimization:

- [ ] Run `bin/rails test`
- [ ] Run system tests: `bin/rails test:system`
- [ ] Check Lighthouse score: `bin/dev && inspect`
- [ ] Test in Chrome DevTools throttled (Fast 3G)
- [ ] Test on mobile device (real)
- [ ] Check ActionCable connectivity
- [ ] Verify form submissions work
- [ ] Test export functionality
- [ ] Check responsive design (375px, 768px, 1920px)
- [ ] Validate HTML: No console errors

---

## References

- Tailwind CSS Performance: https://tailwindcss.com/docs/optimizing-for-production
- Stimulus Best Practices: https://stimulus.hotwired.dev/
- Virtual Scrolling: https://developer.chrome.com/docs/lighthouse/performance/
- Core Web Vitals: https://web.dev/vitals/

---

**Last Updated:** December 2, 2025
**Status:** Ready for implementation
**Estimated Total Effort:** 15-20 hours
**Expected Performance Gain:** 25-40% faster UI rendering
