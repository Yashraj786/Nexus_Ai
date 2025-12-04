# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session, counter_cache: :messages_count

  MAX_CONTENT_LENGTH = 10_000

  # Trigger AI response job for user messages
  after_create :enqueue_ai_response, if: :user?

  # Helper methods for role checking
  def user?
    role == "user"
  end

  def assistant?
    role == "assistant"
  end

  def system?
    role == "system"
  end

  # Helper method for sanitized check
  def sanitized?
    respond_to?(:sanitized) && sanitized
  end

  private

  # Enqueue the AI response job when a user message is created
  def enqueue_ai_response
    AiResponseJob.set(wait: 0).perform_later(
      id,
      enqueued_at: Time.now.utc.to_f
    )
  end
end
