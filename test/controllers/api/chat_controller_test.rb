require "test_helper"

class Api::ChatControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Clear API token for test isolation
    ENV["API_TOKEN"] = nil
  end

  test "should create with valid request in test mode" do
    # Skip test - API requires proper Gemini integration
    skip "Requires Gemini API integration with proper credentials"
  end

  test "should reject request with missing chat_history" do
    post api_chat_url,
         params: {
           chat: {
             persona_key: "Developer"
           }
         },
         as: :json

    assert_response :bad_request
    response_json = JSON.parse(response.body)
    assert_equal false, response_json["success"]
    assert_includes response_json["error"], "chat_history is required"
  end

  test "should reject request with missing persona_key" do
    post api_chat_url,
         params: {
           chat: {
             chat_history: [ { role: "user", parts: [ { text: "Hello" } ] } ]
           }
         },
         as: :json

    assert_response :bad_request
    response_json = JSON.parse(response.body)
    assert_equal false, response_json["success"]
    assert_includes response_json["error"], "persona_key is required"
  end
end
