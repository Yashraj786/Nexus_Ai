# frozen_string_literal: true

require 'net/http'
require 'json'

module Ai
  # Generic LLM client that supports multiple providers
  # Users can bring their own API keys for OpenAI, Anthropic, Gemini, etc.
  class LlmClient
    TIMEOUT = 30 # seconds

    def initialize(user)
      @user = user
      @provider = user.api_provider
      @api_key = user.encrypted_api_key
      @model = user.api_model_name
    end

    # Check if user has configured their API key
    def api_configured?
      @user.api_configured?
    end

    # Generate content using the user's configured LLM
    def generate_content(context)
      validate_configuration!

      result = case @provider
      when 'openai'
        generate_with_openai(context)
      when 'anthropic'
        generate_with_anthropic(context)
      when 'gemini'
        generate_with_gemini(context)
      when 'ollama'
        generate_with_ollama(context)
      when 'custom'
        generate_with_custom(context)
      else
        { success: false, error: "Unsupported provider: #{@provider}" }
      end

      # Log the API usage
      log_usage(result)
      result
    rescue StandardError => e
      log_usage(handle_error(e))
      handle_error(e)
    end

    private

    def validate_configuration!
      raise ArgumentError, "API not configured. User must set API key in settings." unless api_configured?
    end

    # OpenAI API (ChatGPT)
    def generate_with_openai(context)
      uri = URI('https://api.openai.com/v1/chat/completions')
      payload = build_openai_payload(context)
      response = make_request(uri, payload, 'Bearer', @api_key)
      parse_openai_response(response)
    end

    def build_openai_payload(context)
      {
        model: @model,
        messages: format_for_openai(context),
        temperature: 0.7,
        max_tokens: 2048
      }
    end

    def format_for_openai(context)
      context.map do |msg|
        {
          role: msg['role'] == 'system' ? 'system' : msg['role'],
          content: msg['parts'].map { |p| p['text'] }.join(' ')
        }
      end
    end

    def parse_openai_response(response)
      case response.code.to_i
      when 200
        body = JSON.parse(response.body)
        {
          success: true,
          data: body.dig('choices', 0, 'message', 'content')
        }
      when 401
        { success: false, error: "Invalid OpenAI API key" }
      when 429
        { success: false, error: "Rate limit exceeded. Please try again later." }
      else
        { success: false, error: "OpenAI API error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      { success: false, error: "Failed to parse OpenAI response: #{e.message}" }
    end

    # Anthropic API (Claude)
    def generate_with_anthropic(context)
      uri = URI('https://api.anthropic.com/v1/messages')
      payload = build_anthropic_payload(context)
      response = make_request(uri, payload, 'Bearer', @api_key)
      parse_anthropic_response(response)
    end

    def build_anthropic_payload(context)
      {
        model: @model,
        max_tokens: 2048,
        messages: format_for_anthropic(context),
        system: extract_system_prompt(context)
      }
    end

    def format_for_anthropic(context)
      context.reject { |msg| msg['role'] == 'system' }
             .map do |msg|
        {
          role: msg['role'],
          content: msg['parts'].map { |p| p['text'] }.join(' ')
        }
      end
    end

    def extract_system_prompt(context)
      system_msg = context.find { |msg| msg['role'] == 'system' }
      system_msg ? system_msg['parts'].map { |p| p['text'] }.join(' ') : nil
    end

    def parse_anthropic_response(response)
      case response.code.to_i
      when 200
        body = JSON.parse(response.body)
        {
          success: true,
          data: body.dig('content', 0, 'text')
        }
      when 401
        { success: false, error: "Invalid Anthropic API key" }
      when 429
        { success: false, error: "Rate limit exceeded. Please try again later." }
      else
        { success: false, error: "Anthropic API error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      { success: false, error: "Failed to parse Anthropic response: #{e.message}" }
    end

    # Google Gemini API
    def generate_with_gemini(context)
      uri = URI("https://generativelanguage.googleapis.com/v1beta/models/#{@model}:generateContent?key=#{@api_key}")
      payload = build_gemini_payload(context)
      response = make_request(uri, payload, nil, nil)
      parse_gemini_response(response)
    end

    def build_gemini_payload(context)
      {
        contents: context,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        safetySettings: []
      }
    end

    def parse_gemini_response(response)
      case response.code.to_i
      when 200
        body = JSON.parse(response.body)
        {
          success: true,
          data: body.dig('candidates', 0, 'content', 'parts', 0, 'text')
        }
      when 401
        { success: false, error: "Invalid Gemini API key" }
      when 429
        { success: false, error: "Rate limit exceeded. Please try again later." }
      else
        { success: false, error: "Gemini API error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      { success: false, error: "Failed to parse Gemini response: #{e.message}" }
    end

    # Ollama (local LLM)
    def generate_with_ollama(context)
      # @api_key contains the Ollama endpoint URL (e.g., http://localhost:11434)
      uri = URI("#{@api_key}/api/generate")
      payload = build_ollama_payload(context)
      response = make_request(uri, payload, nil, nil)
      parse_ollama_response(response)
    end

    def build_ollama_payload(context)
      prompt = context.map { |msg| "#{msg['role']}: #{msg['parts'].map { |p| p['text'] }.join(' ')}" }.join("\n")
      {
        model: @model,
        prompt: prompt,
        stream: false
      }
    end

    def parse_ollama_response(response)
      case response.code.to_i
      when 200
        body = JSON.parse(response.body)
        {
          success: true,
          data: body['response']
        }
      else
        { success: false, error: "Ollama API error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      { success: false, error: "Failed to parse Ollama response: #{e.message}" }
    end

    # Custom API endpoint (user-defined)
    def generate_with_custom(context)
      # @api_key contains custom endpoint URL
      uri = URI(@api_key)
      payload = { context: context, model: @model }
      response = make_request(uri, payload, nil, nil)
      parse_custom_response(response)
    end

    def parse_custom_response(response)
      case response.code.to_i
      when 200
        body = JSON.parse(response.body)
        {
          success: true,
          data: body['response'] || body['data'] || body['content']
        }
      else
        { success: false, error: "Custom API error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      { success: false, error: "Failed to parse custom response: #{e.message}" }
    end

    # HTTP request helper
    def make_request(uri, payload, auth_type = nil, auth_token = nil)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.read_timeout = TIMEOUT
      http.open_timeout = TIMEOUT

      request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
      request['Authorization'] = "#{auth_type} #{auth_token}" if auth_type && auth_token
      request.body = payload.to_json

      http.request(request)
    end

    def handle_error(error)
      Rails.logger.error "LLM Client Error: #{error.class} - #{error.message}"
      {
        success: false,
        error: "API request failed: #{error.message}"
      }
    end

    def log_usage(result)
      status = result[:success] ? 'success' : 'error'
      error_message = result[:error] if result[:error]
      request_tokens = result[:request_tokens]
      response_tokens = result[:response_tokens]

      ApiUsageLog.log_request(
        @user,
        @provider,
        @model,
        status: status,
        request_tokens: request_tokens,
        response_tokens: response_tokens,
        error_message: error_message
      )
    rescue StandardError => e
      Rails.logger.error "Failed to log API usage: #{e.message}"
    end
  end
end
