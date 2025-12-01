# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session, counter_cache: true

  MAX_CONTENT_LENGTH = 10_000
end
