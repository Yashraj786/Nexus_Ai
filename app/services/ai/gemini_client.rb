# frozen_string_literal: true

require 'net/http'
require 'json'

module Ai
  # HTTP client for Google Gemini API
  # Handles low-level API communication with proper error handling
  class GeminiClient
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    TIMEOUT = 30 # seconds

    # Checks if the Google Gemini API key is configured.
    # @return [Boolean] true if the API key is present, false otherwise.
    def self.api_key_configured?
      ENV.fetch('GOOGLE_API_KEY', nil).present? ||
        Rails.application.credentials.dig(:google, :api_key).present?
    end

    # Initializes the GeminiClient with the API key.
    def initialize
      @api_key = fetch_api_key
    end

    # Generates content using the Google Gemini API.
    # @param context [Array<Hash>] The conversation context in Gemini format.
    # @return [Hash] A hash containing the success status and the generated data or an error message.
    def generate_content(context)
      validate_api_key!

      payload = build_payload(context)
      response = make_request(payload)

      parse_response(response)
    rescue StandardError => e
      handle_error(e)
    end

    # Generates content using the Google Gemini API with a pre-built payload.
    # @param payload [Hash] The pre-built payload for the Gemini API.
    # @return [Hash] A hash containing the success status and the generated data or an error message.
    def generate(payload)
      validate_api_key!

      response = make_request(payload)

      parse_response(response)
    rescue StandardError => e
      handle_error(e)
    end

    private

    def fetch_api_key
      # Try environment variable first, then credentials file
      ENV.fetch('GOOGLE_API_KEY', nil) ||
        Rails.application.credentials.dig(:google, :api_key)
    end

    def validate_api_key!
      return if @api_key.present?

      raise ArgumentError,
        "Google API key not found. Set GOOGLE_API_KEY environment variable or configure credentials."
    end

    def build_payload(context)
      {
        contents: context,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }
    end

    def make_request(payload)
      uri = URI("#{API_URL}?key=#{@api_key}")

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = TIMEOUT
      http.open_timeout = TIMEOUT

      request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
      request.body = payload.to_json

      http.request(request)
    end

    def parse_response(response)
      case response.code.to_i
      when 200
        {
          success: true,
          data: JSON.parse(response.body)
        }
      when 400
        {
          success: false,
          error: "Invalid request: #{extract_error_message(response)}"
        }
      when 401
        {
          success: false,
          error: "Authentication failed. Please check your API key."
        }
      when 429
        {
          success: false,
          error: "Rate limit exceeded. Please try again later."
        }
      when 500..599
        {
          success: false,
          error: "Gemini API server error. Please try again later."
        }
      else
        {
          success: false,
          error: "Unexpected response code: #{response.code}"
        }
      end
    rescue JSON::ParserError => e
      {
        success: false,
        error: "Failed to parse API response: #{e.message}"
      }
    end

    def extract_error_message(response)
      body = JSON.parse(response.body)
      body.dig('error', 'message') || body['error'] || response.body
    rescue JSON::ParserError
      response.body
    end

    def handle_error(error)
      Rails.logger.error "GeminiClient Error: #{error.class} - #{error.message}"

      {
        success: false,
        error: "API request failed: #{error.message}"
      }
    end
  end
end
