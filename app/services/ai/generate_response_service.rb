# app/services/ai/generate_response_service.rb

module Ai
  class GenerateResponseService
    attr_reader :chat_session

    def initialize(chat_session)
      @chat_session = chat_session
    end

    def call
      # Validate inputs
      return { success: false, content: nil, error: "Chat session cannot be nil" } if @chat_session.nil?
      return { success: false, content: nil, error: "Chat session must have a persona" } if @chat_session.persona.nil?

      begin
        # Build context and call Gemini API
        context = build_gemini_context
        
        # TODO: Integrate with actual Gemini client when API keys are configured
        # client = Ai::GeminiClient.new
        # response = client.generate(context)
        
        # Mocked success response for now
        response_text = "This is a placeholder AI response. Integrate with Gemini API."
        
        { success: true, content: response_text, error: nil }
      rescue Net::ReadTimeout, Net::OpenTimeout, Timeout::Error => e
        { success: false, content: nil, error: "The AI service is currently unavailable. Please try again later." }
      rescue StandardError => e
        { success: false, content: nil, error: e.message }
      end
    end

    # Generate a title for a chat session based on initial messages
    def self.call_for_title(prompt)
      return "Untitled Conversation" if prompt.blank?

      begin
        # TODO: Integrate with actual Gemini client for title generation
        # For now, return a placeholder
        "Generated Title"
      rescue StandardError => e
        Rails.logger.warn("Title generation failed: #{e.message}")
        "Untitled Conversation"
      end
    end

    private

    # Formats the existing messages into the structure required by the Gemini API
    def build_gemini_context
      return [] if @chat_session.nil? || @chat_session.persona.nil?

      context_array = []

      # 1. Include the Persona's System Instruction first (as 'system' role, which Gemini expects)
      context_array << { 
        'role' => 'system', 
        'parts' => [{ 'text' => @chat_session.persona.system_instruction }] 
      }

      # Add an acknowledgement message after the system instruction
      context_array << { 'role' => 'assistant', 'parts' => [{ 'text' => "Understood. How can I help?" }] }

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