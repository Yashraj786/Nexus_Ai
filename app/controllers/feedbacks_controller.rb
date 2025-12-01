# frozen_string_literal: true

class FeedbacksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_chat_session, only: [:new, :create, :show]
  before_action :set_feedback, only: [:show]

  def new
    @feedback = @chat_session.feedbacks.build(user: current_user)
  end

  def create
    @feedback = @chat_session.feedbacks.build(feedback_params.merge(
      user: current_user,
      api_events_snapshot: capture_api_events_snapshot,
      request_details: {
        user_agent: request.user_agent,
        ip_address: request.remote_ip
      }
    ))

    if @feedback.save
      log_audit_event(@chat_session, 'created_feedback', { feedback_id: @feedback.id })
      current_user.complete_onboarding_step('submitted_feedback')
      
      handle_bug_report(@chat_session) if @feedback.bug?
      
      redirect_to @chat_session, notice: 'Feedback submitted successfully. Thank you for your help in making Nexus AI better!'
    else
      flash.now[:alert] = 'Could not submit feedback. Please check the errors below.'
      render :new, status: :unprocessable_entity
    end
  end

  def show
  end

  private

  def set_chat_session
    chat_session_id = params[:chat_session_id] || params.dig(:feedback, :chat_session_id)
    @chat_session = current_user.chat_sessions.find(chat_session_id)
  rescue ActiveRecord::RecordNotFound, NoMethodError, ArgumentError
    redirect_to chat_sessions_path, alert: 'Chat session not found.'
  end

  def set_feedback
    @feedback = @chat_session.feedbacks.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to @chat_session, alert: 'Feedback not found.'
  end

  def feedback_params
    params.require(:feedback).permit(:message, :category, :feedback_priority, :chat_session_id)
  end

  # Handle bug report notifications
  def handle_bug_report(chat_session)
    exception = RuntimeError.new("User-reported bug in chat session #{chat_session.id}")
    context = {
      user: current_user&.email,
      params: feedback_params.to_h,
      feedback_id: @feedback.id,
      chat_session_id: chat_session.id
    }
    ErrorNotifierService.call(exception, context: context)
  end

  # Capture recent API events for debugging
  def capture_api_events_snapshot(limit = 20)
    snapshot = []
    
    begin
      log_file = DashboardService::LOG_FILE
      return snapshot unless File.exist?(log_file)

      # Read last N lines more efficiently
      lines = read_last_n_lines(log_file, limit * 2)
      
      lines.reverse_each do |line|
        next if line.strip.empty?

        begin
          event = JSON.parse(line)
          snapshot << event
          break if snapshot.size >= limit
        rescue JSON::ParserError => e
          Rails.logger.debug("Skipped malformed log line: #{e.message}")
        end
      end
      
      snapshot.reverse
    rescue StandardError => e
      Rails.logger.warn("Failed to capture API events snapshot: #{e.class.name} - #{e.message}")
      []
    end
  end

  # Read last N lines of file efficiently without loading entire file
  def read_last_n_lines(file_path, n)
    File.readlines(file_path).last(n) || []
  rescue StandardError => e
    Rails.logger.warn("Failed to read log file: #{e.class.name} - #{e.message}")
    []
  end
end
