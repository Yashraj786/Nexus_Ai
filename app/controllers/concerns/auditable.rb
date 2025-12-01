# app/controllers/concerns/auditable.rb
module Auditable
  extend ActiveSupport::Concern

  private

  def log_audit_event(chat_session, action, metadata = {})
    AuditEvent.create(
      user: current_user,
      chat_session: chat_session,
      action: action,
      metadata: metadata
    )
  end
end
