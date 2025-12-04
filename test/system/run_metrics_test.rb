# test/system/run_metrics_test.rb
require "application_system_test_case"

class RunMetricsTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @chat_session = chat_sessions(:one)
    sign_in @user
  end

  test "visiting a chat session with run metrics" do
    # Create messages to ensure metrics are calculated correctly
    @chat_session.messages.create!(role: "user", content: "User message 1")
    @chat_session.messages.create!(role: "assistant", content: "Assistant reply 1")
    @chat_session.messages.create!(role: "user", content: "User message 2")

    visit chat_session_url(@chat_session)

    assert_text "Run Metrics"
    assert_text "Total Messages: 3"
    assert_text "User Messages: 2"
    assert_text "Assistant Messages: 1"
    assert_text "Session Length:"
  end
end
