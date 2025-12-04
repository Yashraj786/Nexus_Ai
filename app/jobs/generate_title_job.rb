# frozen_string_literal: true

# Background job to auto-generate a title for chat sessions
class GenerateTitleJob < ApplicationJob
  queue_as :default

  def perform(chat_session_id)
    chat_session = ChatSession.find_by(id: chat_session_id)
    return unless chat_session

    # Skip if already has a custom title or less than 2 messages
    return if chat_session.title.present? && !chat_session.title.start_with?("New")

    user_messages_count = chat_session.messages.where(role: "user").count
    return if user_messages_count < 2

    # Build a short prompt to generate title
    first_messages = chat_session.messages.order(:created_at).limit(4).map(&:content).join("\n")
    title_prompt = "Based on this conversation start, generate a very short (3-5 words) descriptive title:\n\n#{first_messages.truncate(500)}"

    # Call AI service with a simple system instruction
    response = Ai::GenerateResponseService.call_for_title(title_prompt)

    # Clean up and save the title
    generated_title = response.strip.gsub(/["']/, "").truncate(50)

    if chat_session.update(title: generated_title)
      Rails.logger.info("Generated title for session #{chat_session.id}: #{generated_title}")
    else
      Rails.logger.warn("Failed to save title for session #{chat_session.id}: #{chat_session.errors.full_messages.join(', ')}")
    end
  rescue StandardError => e
    Rails.logger.error("Failed to generate title for session #{chat_session_id}: #{e.class.name} - #{e.message}")
    # Don't retry on failure - it's not critical
  end
end
