require "test_helper"

class ChatSessionsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @chat_session = chat_sessions(:one)
    sign_in @user
  end

  test "should get index" do
    get chat_sessions_url
    assert_response :success
  end

  test "should get show" do
    get chat_session_url(@chat_session)
    assert_response :success
  end

  test "should get new" do
    get new_chat_session_url
    assert_response :success
  end

  test "should create chat_session" do
    persona = personas(:developer)
    assert_difference("ChatSession.count") do
      post chat_sessions_url, params: { persona_id: persona.id }
    end

    assert_redirected_to chat_session_url(assigns(:chat_session))
  end

  test "should export chat_session data as JSON" do
    @chat_session.messages.create!(role: "user", content: "Hello export")
    @chat_session.feedbacks.create!(user: @user, message: "Export feedback", category: "bug", feedback_priority: "high")

    download_key = "export-#{SecureRandom.uuid}"
    ExportChatSessionJob.perform_now(@chat_session.id, download_key)

    json_data = Rails.cache.read(download_key)
    assert_not_nil json_data

    json_response = JSON.parse(json_data)
    assert_equal @chat_session.id, json_response["id"]
    assert_equal 1, json_response["messages"].count
    assert_equal 1, json_response["feedbacks"].count
    assert_not_nil json_response["run_metrics"]
    assert_not_nil json_response["timeline"]
  end

  test "should create audit event on session creation" do
    persona = personas(:developer)
    assert_difference("AuditEvent.count") do
      post chat_sessions_url, params: { persona_id: persona.id }
    end
    assert_equal "created_session", AuditEvent.last.action
  end

  test "should create audit event on session export" do
    assert_difference("AuditEvent.count") do
      get export_chat_session_url(@chat_session)
    end
    assert_equal "exported_session", AuditEvent.last.action
  end

  test "should show audit trail to admin" do
    @user.update(admin: true)
    get chat_session_url(@chat_session)
    assert_select ".p-4.bg-gray-800.rounded-lg.mt-4", /Audit Trail/
  end

  test "should not show audit trail to non-admin" do
    @user.update(admin: false)
    get chat_session_url(@chat_session)
    assert_select ".p-4.bg-gray-800.rounded-lg.mt-4", text: /Audit Trail/, count: 0
  end

  test "should show pro session analytics to user with feature flag" do
    @user.update(features: { pro_session_analytics: true })
    get chat_session_url(@chat_session)
    assert_select ".p-4.bg-gray-800.rounded-lg", /Session Insights/
  end

  test "should not show pro session analytics to user without feature flag" do
    @user.update(features: { pro_session_analytics: false })
    get chat_session_url(@chat_session)
    assert_select ".p-4.bg-gray-800.rounded-lg", text: /Session Insights/, count: 0
  end
end
