# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session, counter_cache: true

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
end
