# app/services/ai/generate_response_service.rb

module Ai
  class GenerateResponseService
    attr_reader :chat_session, :user

    def initialize(chat_session)
      @chat_session = chat_session
      @user = chat_session.user
    end

    def call
      # Validate inputs
      return { success: false, content: nil, error: "Chat session cannot be nil" } if @chat_session.nil?
      return { success: false, content: nil, error: "Chat session must have a persona" } if @chat_session.persona.nil?
      return { success: false, content: nil, error: "Please configure your API key in settings to use personas" } unless @user.api_configured?

      begin
        # Build context in generic format
        context = build_context
        
        # Initialize LLM client with user's API configuration
        client = Ai::LlmClient.new(@user)
        response = client.generate_content(context)
        
        return response unless response[:success]
        
        { success: true, content: response[:data], error: nil }
      rescue Net::ReadTimeout, Net::OpenTimeout, Timeout::Error => e
        { success: false, content: nil, error: "The AI service is currently unavailable. Please try again later." }
      rescue ArgumentError => e
        { success: false, content: nil, error: e.message }
      rescue StandardError => e
        { success: false, content: nil, error: e.message }
      end
    end

    private

    # Formats the messages into a generic context structure for all LLM providers
    def build_context
      return [] if @chat_session.nil? || @chat_session.persona.nil?

      context_array = []

      # 1. Include the Persona's System Instruction first
      context_array << { 
        'role' => 'system', 
        'parts' => [{ 'text' => @chat_session.persona.system_instruction }] 
      }

      # 2. Add all existing messages
      @chat_session.conversation_history.each do |message|
        context_array << {
          'role' => message.role.to_s,
          'parts' => [{ 'text' => message.content }]
        }
      end
      
      context_array
    end
  end
end