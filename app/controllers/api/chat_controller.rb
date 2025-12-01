# frozen_string_literal: true

class Api::ChatController < ApplicationController
  # Require API token instead of session CSRF token for better security
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!, only: [:create]
  before_action :authenticate_api_token!, only: [:create]

  def create
    # Validate parameters
    return bad_request_error('persona_key is required') if chat_params[:persona_key].blank?
    return bad_request_error('chat_history is required') if chat_params[:chat_history].blank?

    persona = Persona.find_by(name: chat_params[:persona_key]) || Persona.first

    response = call_gemini_api(
      chat_history: chat_params[:chat_history],
      system_instruction: persona.system_instruction
    )

    render json: { success: true, text: response }, status: :ok
  rescue ActiveRecord::RecordNotFound => e
    render json: { success: false, error: 'Persona not found' }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("API Error: #{e.class.name} - #{e.message}")
    render json: { success: false, error: 'The AI service is currently unavailable' }, status: :service_unavailable
  end

  private

  # Strong parameters validation
  def chat_params
    params.require(:chat).permit(:persona_key, chat_history: [])
  rescue ActionController::ParameterMissing
    {}
  end

  # Validate API token from header
  def authenticate_api_token!
    # Skip authentication in test mode or if API_TOKEN is not configured
    return if Rails.env.test? || ENV['API_TOKEN'].blank?

    token = request.headers['X-API-Key']
    return if token.present? && valid_api_token?(token)

    render json: { success: false, error: 'Unauthorized' }, status: :unauthorized
  end

  # Check if provided token is valid
  def valid_api_token?(token)
    token == ENV['API_TOKEN']
  end

  # Helper to return bad request error
  def bad_request_error(message)
    render json: { success: false, error: message }, status: :bad_request
  end

  def call_gemini_api(chat_history:, system_instruction:)
    client = Ai::GeminiClient.new

    payload = {
      contents: chat_history,
      systemInstruction: { parts: [{ text: system_instruction }] }
    }

    response = client.generate(payload)

    response.dig(:data, 'candidates', 0, 'content', 'parts', 0, 'text') || 'No response generated'
  end
end
