require "test_helper"

class FeedbacksControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @chat_session = chat_sessions(:one)
    sign_in @user
  end

  test "should get new nested feedback form" do
    get new_chat_session_feedback_url(@chat_session)
    assert_response :success
  end

  test "should create feedback for chat session" do
    assert_difference("Feedback.count") do
      post chat_session_feedbacks_url(@chat_session), params: {
        feedback: {
          message: "Test feedback",
          category: "bug",
          feedback_priority: "high"
        }
      }
    end
    assert_redirected_to chat_session_url(@chat_session)
  end

  def teardown
    mocha_teardown
  end
end
