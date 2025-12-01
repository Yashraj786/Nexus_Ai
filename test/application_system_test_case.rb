require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 1400 ]

  private

  # Helper to create chat sessions, messages, and feedback using fixture-based approach
  def create_list(model_name, count, attrs = {})
    if count == 1
      send("create_#{model_name}", **attrs)
    else
      count.times.map { send("create_#{model_name}", **attrs) }
    end
  end

  def create_chat_session(user:, persona: personas(:developer))
    ChatSession.create!(user: user, persona: persona, title: "Test Session")
  end

  def create_message(chat_session:, role: 'user', content: 'Test message')
    chat_session.messages.create!(role: role, content: content)
  end

  def create_feedback(chat_session:, user:, message: 'Test feedback', category: 'bug', priority: 'low')
    chat_session.feedbacks.create!(user: user, message: message, category: category, priority: priority)
  end
end
