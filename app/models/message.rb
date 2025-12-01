# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session, counter_cache: :messages_count

  MAX_CONTENT_LENGTH = 10_000

  # Helper methods for role checking
  def user?
    role == 'user'
  end

  def assistant?
    role == 'assistant'
  end

  def system?
    role == 'system'
  end

  # Helper method for sanitized check
  def sanitized?
    respond_to?(:sanitized) && sanitized
  end
end
