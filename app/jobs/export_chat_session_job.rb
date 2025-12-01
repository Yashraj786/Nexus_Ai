# frozen_string_literal: true

class ExportChatSessionJob < ApplicationJob
  queue_as :default

  CACHE_EXPIRATION = 10.minutes

  def perform(chat_session_id, download_key)
    chat_session = ChatSession.find(chat_session_id)

    # Generate the JSON with all associated data
    json_data = chat_session.to_json(include: [:messages, :feedbacks], methods: [:run_metrics, :timeline])

    # Store the JSON in cache for later download
    # TODO: In production, migrate to S3 or other persistent storage
    Rails.cache.write(download_key, json_data, expires_in: CACHE_EXPIRATION)
  rescue StandardError => e
    Rails.logger.error("Failed to export chat session #{chat_session_id}: #{e.class.name} - #{e.message}")
    # Don't retry - let user know export failed
  end
end
