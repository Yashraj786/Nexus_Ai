# test/system/n_plus_one_test.rb
require "application_system_test_case"

class NPlusOneTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    sign_in @user
  end

  # Enable Bullet for each test
  def setup
    Bullet.enable = true
    Bullet.raise = true
    super
  end

  def teardown
    Bullet.raise = false
    Bullet.enable = false
    super
  end

  test "no N+1 queries when loading chat sessions index" do
    # Ensure multiple chat sessions and associated data exist
    chat_sessions = create_list(:chat_session, 3, user: @user)
    chat_sessions.each do |chat_session|
      create_list(:message, 5, chat_session: chat_session)
      create_list(:feedback, 2, chat_session: chat_session, user: @user)
    end

    visit chat_sessions_url
  end

  test "no N+1 queries when loading a chat session show page" do
    chat_session = chat_sessions(:one)
    create_list(:message, 10, { chat_session: chat_session })
    create_list(:feedback, 3, { chat_session: chat_session, user: @user })

    visit chat_session_url(chat_session)
  end
end
