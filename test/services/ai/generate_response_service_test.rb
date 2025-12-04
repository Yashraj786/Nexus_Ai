# frozen_string_literal: true

require "test_helper"

module Ai
  class GenerateResponseServiceTest < ActiveSupport::TestCase
    setup do
      @user = users(:one)
      @persona = personas(:developer)
      @chat_session = chat_sessions(:one)

      # Create some messages for context
      @message1 = @chat_session.messages.create!(role: "user", content: "Hello")
      @message2 = @chat_session.messages.create!(role: "assistant", content: "Hi there!")
      @message3 = @chat_session.messages.create!(role: "user", content: "How are you?")

      assert @message1.valid?
      assert_not_nil @message1.role
      assert @message2.valid?
      assert_not_nil @message2.role
      assert @message3.valid?
      @message1.reload
      @message2.reload
      @message3.reload

      WebMock.enable!
    end

    test "should generate response with valid chat session" do
      # Set up user with API configuration
      @user.update_api_config("gemini", "test_api_key_123", "gemini-2.0-flash")

      # Mock the Gemini API response
      mock_response = {
        data: "I'm doing great! How can I assist you today?",
        success: true
      }

      # Mock the LLM client generate_content call
      Ai::LlmClient.any_instance.stubs(:generate_content).returns(mock_response)

      service = Ai::GenerateResponseService.new(@chat_session)
      result = service.call

      assert result[:success]
      assert_includes result[:content].downcase, "great"
    end

    test "should handle nil chat session" do
      assert_raises(NoMethodError) do
        Ai::GenerateResponseService.new(nil)
      end
    end

    test "should handle chat session without persona" do
      @chat_session.update(persona: nil)
      service = Ai::GenerateResponseService.new(@chat_session)
      result = service.call

      assert_not result[:success]
      assert_includes result[:error], "must have a persona"
    end

      test "should build context with system instruction" do
        service = Ai::GenerateResponseService.new(@chat_session)
        context = service.send(:build_context)

        # Should have system instruction + 3 messages
        assert_equal 4, context.length
        assert_equal "system", context[0]["role"]
        assert_includes context[0]["parts"][0]["text"], @chat_session.persona.system_instruction
      end

     test "should handle API errors" do
       # Set up user with API configuration
       @user.update_api_config("gemini", "test_api_key_123", "gemini-2.0-flash")

       # Mock the LLM client returning an error
       Ai::LlmClient.any_instance.stubs(:generate_content).returns({ success: false, error: "API error occurred" })

       service = Ai::GenerateResponseService.new(@chat_session)
       result = service.call

       assert_not result[:success]
       assert_not_nil result[:error]
     end

      test "should handle network errors gracefully" do
        # Set up user with API configuration
        @user.update_api_config("gemini", "test_api_key_123", "gemini-2.0-flash")

        # Mock the LLM client raising a network error
        Ai::LlmClient.any_instance.stubs(:generate_content).raises(Net::OpenTimeout)

        service = Ai::GenerateResponseService.new(@chat_session)
        result = service.call

        assert_not result[:success]
        assert_not_nil result[:error]
        assert_includes result[:error].downcase, "unavailable"
      end

    def teardown
      mocha_teardown
    end
  end
end
