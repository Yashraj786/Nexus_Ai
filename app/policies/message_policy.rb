# frozen_string_literal: true

# Authorization policy for Message resources
# Messages belong to chat sessions, so we check session ownership
class MessagePolicy < ApplicationPolicy
  # Users can create messages in their own chat sessions
  def create?
    user.present? && record.chat_session.user_id == user.id
  end

  def retry?
    create?
  end

  # Users can view messages in their own chat sessions
  def show?
    user.present? && record.chat_session.user_id == user.id
  end

  # Users cannot update messages (immutable for audit trail)
  def update?
    false
  end

  # Users can delete their own messages
  def destroy?
    user.present? && record.chat_session.user_id == user.id
  end

  # Scope: Only show messages from user's chat sessions
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(:chat_session).where(chat_sessions: { user: user })
    end
  end
end
