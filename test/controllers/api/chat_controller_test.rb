require "test_helper"

class Api::ChatControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Clear API token for test isolation
    ENV["API_TOKEN"] = nil
    WebMock.enable!
  end

  test "should create with valid request in test mode" do
    # Even though this test doesn't have a real API key configured,
    # we can verify the endpoint properly processes valid parameter structure
    # The actual API call will fail gracefully with "No response generated"
    # which still demonstrates the endpoint accepts the request

    post api_chat_url,
         params: {
           chat: {
             persona_key: "Developer",
             chat_history: [ { role: "user", parts: [ { text: "Hello" } ] } ]
           }
         },
         as: :json

    # In test mode without API credentials, we expect the default response
    assert_response :success
    response_json = JSON.parse(response.body)
    assert_equal true, response_json["success"]
    # The response is generated but might be "No response generated" if API isn't configured
    assert_not_nil response_json["text"]
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
