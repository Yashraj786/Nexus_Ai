# NEXUS AI - AUDIT ACTION ITEMS

## 🔴 CRITICAL - MUST FIX (Blocking Production)

### 1. Message Form Missing
- **Issue:** Users cannot send messages - core feature broken
- **File:** `/app/views/messages/_form.html.erb` (MISSING - needs creation)
- **Reference:** `app/views/chat_sessions/show.html.erb` line 51 references it
- **Effort:** 30 minutes
- **Solution:**
  ```erb
  <!-- Create app/views/messages/_form.html.erb -->
  <%= form_with(model: [@chat_session, message], local: true) do |f| %>
    <%= f.text_area :content, rows: 3, placeholder: "Type your message..." %>
    <%= f.submit "Send" %>
  <% end %>
  ```

### 2. Message Model Missing Validations
- **File:** `/app/models/message.rb`
- **Lines:** 3-25 (needs additions)
- **Effort:** 30 minutes
- **Solution:**
  ```ruby
  validates :content, presence: true, length: { minimum: 1, maximum: 10000 }
  validates :role, presence: true, inclusion: { in: %w(user assistant system) }
  validates :chat_session, presence: true
  ```

### 3. API Key Encryption Not Implemented
- **Issue:** Keys stored in plaintext in database - SECURITY RISK
- **Files:**
  - `/app/models/user.rb` - lines 111, 112, 114 (encrypted_api_key, etc.)
  - `/app/services/ai/llm_client.rb` - lines 18, 23 (using keys directly)
  - `/app/controllers/settings_controller.rb` - lines 22-24
- **Effort:** 1-2 hours
- **Solution:**
  1. Add gem: `gem 'attr_encrypted'`
  2. Run migrations to add encryption keys
  3. Update User model:
     ```ruby
     attr_encrypted :api_key, key: ENV['ENCRYPTION_KEY']
     attr_encrypted :fallback_api_key, key: ENV['ENCRYPTION_KEY']
     ```

### 4. Message Retry Endpoint Missing
- **Issue:** Route defined but no controller action - retry button won't work
- **File:** `/config/routes.rb` line 35 defines `post :retry`
- **Missing:** Controller action in `ChatSessions::MessagesController`
- **Effort:** 1-2 hours
- **Solution:**
  ```ruby
  def retry
    @message = @chat_session.messages.find(params[:id])
    authorize @chat_session
    AiResponseJob.perform_later(@message.id, enqueued_at: Time.current.to_f)
    render json: { status: 'retrying' }
  end
  ```

### 5. Export Uses Cache Only
- **Issue:** Exports may expire/be lost - unreliable for production
- **File:** `/app/jobs/export_chat_session_job.rb` lines 19-24
- **TODO Comment:** Line 8 acknowledges "In production, migrate to S3"
- **Effort:** 2-3 hours
- **Solution:**
  1. Add AWS SDK gem
  2. Configure S3 bucket
  3. Upload JSON to S3 instead of Rails.cache
  4. Return download URL instead of cache key

---

## 🟠 HIGH PRIORITY - FIX BEFORE LAUNCH (2-3 days)

### 6. Last Active Timestamp Not Updated
- **Issue:** `chat_session.last_active_at` only set on create, not on new messages
- **File:** `/app/models/chat_session.rb` line 66 (only in callback)
- **Impact:** Session sort order becomes incorrect over time
- **Effort:** 30 minutes
- **Solution:**
  ```ruby
  # In ChatSession model
  after_create :set_last_active_at
  
  # Add new callback:
  after_update_of :messages_count, :touch_activity
  
  private
  def touch_activity
    update_column(:last_active_at, Time.current)
  end
  ```
  OR simpler: Add `touch: :chat_session` to Message model

### 7. Missing Loading States
- **Issue:** No spinners/skeleton screens while API processes - poor UX
- **Files:**
  - `/app/frontend/entrypoints/controllers/chat_controller.js` - needs spinner on submit
  - `/app/views/chat_sessions/show.html.erb` - needs loading UI
  - `/app/views/settings/show.html.erb` line 102 - test button needs better spinner
- **Effort:** 2-3 hours
- **Solution:**
  1. Create loading spinner component
  2. Add to form submission
  3. Disable inputs during submit
  4. Show skeleton screens for initial loads

### 8. Missing Confirmation Dialogs
- **Issue:** Users can accidentally delete data with native confirm()
- **Files:**
  - `/app/views/settings/show.html.erb` line 108 - "Clear API Key"
  - `/app/views/shared/_sidebar.html.erb` line 81 - "Logout"
  - `/app/controllers/chat_sessions_controller.rb` line 107 - delete session
- **Effort:** 2 hours
- **Solution:**
  ```erb
  <!-- Replace data: { confirm: "..." } with modal -->
  <div data-controller="modal">
    <button data-action="click->modal#open">Delete</button>
    <div data-modal-target="content" hidden>
      <p>Are you sure?</p>
      <form method="POST" action="..."><%= button_tag "Delete" %></form>
    </div>
  </div>
  ```

### 9. Sidebar N+1 Query
- **Issue:** Loads 10 sessions + queries each for persona - database inefficiency
- **File:** `/app/views/shared/_sidebar.html.erb` line 20
- **Query:** `current_user.chat_sessions.order(updated_at: :desc).limit(10)`
- **Effort:** 30 minutes
- **Solution:**
  ```ruby
  # In sidebar:
  current_user.chat_sessions.includes(:persona).order(updated_at: :desc).limit(10)
  ```

### 10. Rate Limit Config Hardcoded
- **Issue:** Limits are hardcoded in code, should be configurable
- **File:** `/app/models/api_usage_log.rb` lines 56-80
- **Limits:** Minute: 60, Hour: 300, Day: 1000 (assumed)
- **Effort:** 1 hour
- **Solution:**
  ```ruby
  # Create config/initializers/rate_limits.rb
  RATE_LIMITS = {
    minute: ENV.fetch('RATE_LIMIT_MINUTE', 60).to_i,
    hour: ENV.fetch('RATE_LIMIT_HOUR', 300).to_i,
    day: ENV.fetch('RATE_LIMIT_DAY', 1000).to_i
  }
  ```

### 11. Markdown Code Highlighting Not Initialized
- **Issue:** Highlight.js loaded but never called
- **Files:**
  - `/app/views/layouts/application.html.erb` line 19 - Highlight.js loaded
  - `/app/views/chat_sessions/show.html.erb` line 39 - markdown rendered
- **Effort:** 1 hour
- **Solution:**
  ```javascript
  // In chat_controller.js
  _received(data) {
    if (data.turbo_stream) {
      Turbo.renderStreamMessage(data.turbo_stream);
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
      this.scrollToBottom();
    }
  }
  ```

### 12. Title Auto-Generation Never Triggered
- **Issue:** GenerateTitleJob exists but never called
- **File:** `/app/jobs/generate_title_job.rb` exists but not enqueued anywhere
- **Impact:** Session titles always default "New Developer Chat"
- **Effort:** 1 hour
- **Solution:**
  ```ruby
  # In ChatSessions::MessagesController#create or after first message
  GenerateTitleJob.perform_later(@chat_session.id) if @chat_session.messages.count == 2
  ```

---

## 🟡 MEDIUM PRIORITY - FIX BEFORE RELEASE (3-5 days)

### 13. Missing Error Pages (403, 429, 503)
- **Existing:** `public/400.html`, `404.html`, `422.html`, `500.html`
- **Missing:** `403.html`, `429.html`, `503.html`
- **Files to create:**
  - `/public/403.html`
  - `/public/429.html`
  - `/public/503.html`
- **Effort:** 1 hour
- **Solution:** Copy existing error pages and customize messages

### 14. Copy to Clipboard No Feedback
- **Issue:** Users don't know if copy succeeded
- **File:** `/app/frontend/entrypoints/controllers/clipboard_controller.js`
- **Effort:** 1 hour
- **Solution:**
  ```javascript
  async copy() {
    const text = this.sourceTarget.textContent;
    await navigator.clipboard.writeText(text);
    // Show success toast
    this.showToast('Copied to clipboard!');
  }
  ```

### 15. Session Search/Filter Missing
- **Issue:** Can only see recent sessions, no search functionality
- **File:** `/app/controllers/chat_sessions_controller.rb` line 10
- **Effort:** 2-3 hours
- **Solution:**
  ```ruby
  def index
    @chat_sessions = policy_scope(ChatSession).includes(:persona)
    @chat_sessions = @chat_sessions.where("title ILIKE ?", "%#{params[:q]}%") if params[:q].present?
    @chat_sessions = @chat_sessions.recent
  end
  ```

### 16. Message Search Missing
- **Issue:** Can't search past messages in a session
- **Effort:** 2-3 hours (requires new controller action + frontend)
- **Solution:** Add MessageSearchService and search endpoint

### 17. Session Edit UI Missing
- **Issue:** Can update title via update action but no UI
- **File:** `/app/views/chat_sessions/show.html.erb` - needs edit modal
- **Effort:** 1-2 hours
- **Solution:**
  ```erb
  <!-- Add edit modal to show.html.erb -->
  <div data-controller="modal">
    <button>Edit Title</button>
    <%= form_with model: @chat_session, local: true do |f| %>
      <%= f.text_field :title %>
      <%= f.submit %>
    <% end %>
  </div>
  ```

### 18. Markdown CSS Classes Missing
- **Issue:** Code blocks not styled properly
- **File:** `/app/views/chat_sessions/show.html.erb` line 38
- **Effort:** 30 minutes
- **Solution:**
  ```erb
  <div class="prose prose-sm max-w-none text-neutral-900">
    <%= markdown(msg.content) %>
  </div>
  ```

### 19. Sidebar Hidden on Desktop by Default
- **Issue:** Chat sidebar shows only on desktop with lg:block, but hidden at load
- **File:** `/app/views/chat_sessions/show.html.erb` line 66
- **Effort:** 30 minutes
- **Solution:**
  ```erb
  <div class="w-64 ... block lg:block"> <!-- Change hidden to block -->
  ```

### 20. Sensitive Data Filtering in Logs
- **Issue:** API keys might appear in logs
- **File:** `/config/initializers/filter_parameter_logging.rb`
- **Current:** Only filters password, encrypted_password
- **Effort:** 30 minutes
- **Solution:**
  ```ruby
  Rails.application.config.filter_parameters += [
    :encrypted_api_key,
    :encrypted_fallback_api_key,
    :api_key,
    :fallback_api_key
  ]
  ```

---

## 🟢 LOW PRIORITY - NICE TO HAVE (After Launch)

- [ ] Typing indicators (ActionCable feature)
- [ ] Message reactions (Emoji system)
- [ ] File upload support (Shrine/ActiveStorage)
- [ ] Message editing/deletion (Soft delete)
- [ ] Read receipts (WebSocket tracking)
- [ ] Link previews (Metadata extraction)
- [ ] Exponential backoff in retries
- [ ] Cost tracking (Token prices)
- [ ] Dark mode support
- [ ] Multi-language support

---

## 📋 IMPLEMENTATION ORDER

### Phase 1: Critical (1-2 days)
1. Create message form partial
2. Add message validations
3. Implement API key encryption
4. Implement message retry endpoint
5. Migrate export to persistent storage

### Phase 2: High Priority (2-3 days)
6. Add last active timestamp tracking
7. Add loading states
8. Create confirmation modals
9. Fix sidebar N+1 query
10. Externalize rate limit config
11. Initialize markdown highlighting
12. Trigger title auto-generation

### Phase 3: Medium Priority (3-5 days)
13. Add missing error pages
14. Add clipboard feedback
15. Implement session search
16. Implement message search
17. Add session edit UI
18. Add markdown CSS
19. Fix sidebar visibility
20. Filter sensitive data from logs

### Phase 4: Polish & Testing (1 week)
- Add animations/transitions
- Improve error messages
- Security audit
- Performance testing
- Load testing

---

## ✅ TESTING CHECKLIST

- [ ] Message form allows sending text
- [ ] Message validation prevents empty messages
- [ ] API keys are encrypted in database
- [ ] Message retry works
- [ ] Export downloads successfully
- [ ] Last active updates on each message
- [ ] Loading spinners appear during async ops
- [ ] Confirmation dialogs prevent accidents
- [ ] Sidebar loads efficiently
- [ ] Rate limits can be configured
- [ ] Code blocks syntax highlight
- [ ] Session titles auto-generated
- [ ] All error pages load properly
- [ ] Copy button shows feedback
- [ ] Session search works
- [ ] Forms have confirmation modals
- [ ] Mobile menu animates smoothly
- [ ] API keys not in logs

---

**Generated:** December 4, 2025
**Total Estimated Time:** ~16-20 hours to reach production readiness
**Priority:** Fix Phase 1 before any user testing
