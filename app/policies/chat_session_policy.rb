# frozen_string_literal: true

# Authorization policy for ChatSession resources
# Ensures users can only access their own chat sessions
class ChatSessionPolicy < ApplicationPolicy
  # Users can view list of their own sessions
  def index?
    user.present?
  end

  # Users can only view their own sessions
  def show?
    user.present? && record.user_id == user.id
  end

  # Users can create new sessions
  def create?
    user.present?
  end

  # Users can update only their own sessions
  def update?
    user.present? && record.user_id == user.id
  end

  # Users can delete only their own sessions
  def destroy?
    user.present? && record.user_id == user.id
  end

  # Users can export only their own sessions
  def export?
    show?
  end

  def export_status?
    show?
  end

  def download?
    show?
  end

  # Scope: Only show user's own chat sessions
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end
end
