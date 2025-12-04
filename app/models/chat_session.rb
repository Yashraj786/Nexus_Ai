# frozen_string_literal: true

# ChatSession model - represents a conversation session with a specific AI persona
class ChatSession < ApplicationRecord
  belongs_to :user
  belongs_to :persona
  has_many :messages, dependent: :destroy
  has_many :feedbacks, dependent: :destroy
  has_many :audit_events, dependent: :destroy

  validates :persona, presence: true
  validates :user, presence: true

  # Callbacks
  before_create :set_default_title
  before_create :set_last_active_at

  # Constants for configuration
  ACTIVE_THRESHOLD = 7.days.ago.freeze
  STATUS_ACTIVE_THRESHOLD = 10.minutes.ago.freeze

  # Scopes
  scope :recent, -> { order(last_active_at: :desc) }
  scope :active, -> { where("last_active_at > ?", ACTIVE_THRESHOLD) }
  scope :with_persona, -> { includes(:persona) }
  scope :with_messages, -> { includes(:messages) }

  # Scope to retrieve the conversation history in order
  def conversation_history
    messages.order(created_at: :asc)
  end

  def status
    updated_at > STATUS_ACTIVE_THRESHOLD ? "active" : "inactive"
  end

  def run_metrics
    # Use single query with group counting to avoid N+1 queries
    message_counts = messages.group(:role).count
    {
      total_messages: messages.count,
      user_messages: message_counts["user"] || 0,
      assistant_messages: message_counts["assistant"] || 0,
      session_length: (updated_at - created_at).round(2)
    }
  end

  def timeline
    # Optimize by loading all message timestamps in one query
    assistant_messages = messages.where(role: "assistant")
    {
      started_at: created_at,
      first_reply_at: assistant_messages.minimum(:created_at),
      last_reply_at: assistant_messages.maximum(:created_at),
      last_feedback_at: feedbacks.maximum(:created_at)
    }
  end

  private

  def set_default_title
    self.title ||= "New #{persona.name} Chat"
  end

  def set_last_active_at
    self.last_active_at ||= Time.current
  end
end
