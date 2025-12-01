# test/system/session_timeline_test.rb
require "application_system_test_case"

class SessionTimelineTest < ApplicationSystemTestCase
  setup do
    @chat_session = chat_sessions(:one)
  end

  test "visiting a chat session with a full timeline" do
    # Create messages to ensure first and last reply times
    @chat_session.messages.create!(role: 'assistant', content: 'First reply', created_at: 2.hours.ago)
    @chat_session.messages.create!(role: 'assistant', content: 'Last reply', created_at: 1.hour.ago)
    # Create feedback to ensure a feedback time
    @chat_session.feedbacks.create!(user: @chat_session.user, message: 'Test feedback', category: 'bug', priority: 'low', created_at: 30.minutes.ago)

    visit chat_session_url(@chat_session)

    assert_text "Started"
    assert_text "First Reply"
    assert_text "Last Reply"
    assert_text "Feedback"
  end

  test "visiting a chat session with a partial timeline" do
    visit chat_session_url(@chat_session)

    assert_text "Started"
    assert_text "First Reply"
    assert_text "Pending" # No last reply or feedback
  end
end
