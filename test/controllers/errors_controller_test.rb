# test/controllers/errors_controller_test.rb
require "test_helper"

class ErrorsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
  end

  test "should get not_found" do
    get "/404"
    assert_response :success
  end

  test "should get internal_server_error" do
    get "/500"
    assert_response :success
  end

  test "should report internal server error" do
    sign_in @user
    get "/500"
    assert_response :success

    assert_difference("Feedback.count") do
      post feedbacks_url, params: {
        feedback: {
          chat_session_id: chat_sessions(:one).id,
          category: 'bug',
          feedback_priority: 'high',
          message: "Internal Server Error at http://www.example.com/500"
        }
      }
    end
  end
end
