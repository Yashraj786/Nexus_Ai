# frozen_string_literal: true

# Background job to generate AI responses asynchronously
# This prevents blocking the request cycle during API calls
class AiResponseJob < ApplicationJob
  queue_as :default

  MAX_ATTEMPTS = 3

  # Retry configuration for transient errors
  # Using simple wait times for compatibility with all adapters
  retry_on StandardError, wait: 2, attempts: MAX_ATTEMPTS

  def perform(message_id, options = {})
    enqueued_at = options[:enqueued_at]
    started_at = Time.now.utc.to_f
    queue_time = enqueued_at ? (started_at - enqueued_at).round(3) : nil

    ApiEventLogger.log("job_started", { message_id: message_id, started_at: started_at, queue_time: queue_time })

    message = Message.find(message_id)
    chat_session = message.chat_session

    begin
      ApiEventLogger.log("job_start_attempt", {
        chat_session_id: chat_session.id,
        user_id: chat_session.user.id,
        message_id: message.id,
        attempt: executions
      })

      result = Ai::GenerateResponseService.call(chat_session)

      if result[:success]
        assistant_message = chat_session.messages.create!(
          role: "assistant",
          content: result[:content]
        )

        # Broadcast the response using proper Turbo Stream format
        broadcast_response(chat_session, assistant_message)

        ApiEventLogger.log("job_success", {
          chat_session_id: chat_session.id,
          user_id: chat_session.user.id,
          message_id: message.id
        })
      else
        raise StandardError, result[:error]
      end
    ensure
      finished_at = Time.now.utc.to_f
      execution_time = (finished_at - started_at).round(3)
      ApiEventLogger.log("job_finished", {
        message_id: message_id,
        finished_at: finished_at,
        execution_time: execution_time
      })
    end
  end

  private

  # Broadcast response to WebSocket subscribers
  def broadcast_response(chat_session, message)
    # Construct turbo stream HTML directly since helper is not available in job context
    turbo_html = %(<turbo-stream action="append" target="chat-container"><template>
      <div class="message assistant-message">
        <div class="font-semibold text-accent-light">Assistant</div>
        <div class="message-content">#{ERB::Util.html_escape(message.content)}</div>
      </div>
    </template></turbo-stream>)

    ActionCable.server.broadcast(
      "chat_session_#{chat_session.id}",
      type: "success",
      message_id: message.id,
      html: turbo_html,
      is_retrying: false
    )
  end

  # Broadcast error to WebSocket subscribers
  def broadcast_error(chat_session, message)
    ActionCable.server.broadcast(
      "chat_session_#{chat_session.id}",
      type: "error",
      error: "The AI service is currently unavailable. Please try again later.",
      message_id: message.id,
      retryable: true,
      is_retrying: false
    )
  end
end
