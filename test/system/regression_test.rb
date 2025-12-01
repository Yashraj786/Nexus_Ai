# test/system/regression_test.rb
require "application_system_test_case"

class RegressionTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    sign_in @user
  end

  test "basic chat flow" do
    Ai::GenerateResponseService.stubs(:call).returns({ success: true, content: "AI Response" })

    visit new_chat_session_url
    find("input[type='radio'][value='developer']").choose
    click_on "Start New Session"

    assert_text "Chat session started successfully."
    assert_text "AI Response"

    fill_in "Command the system...", with: "Hello AI"
    click_on "Send"

    assert_text "Hello AI"
    assert_text "AI Response"
  end

  test "feedback submission and reporting" do
    visit chat_session_url(chat_sessions(:one))
    click_on "Report a Problem"

    assert_text "Report a Problem for Chat Session:"
    select "Bug", from: "Category"
    select "High", from: "Priority"
    fill_in "What went wrong or what would you like to report?", with: "The AI is not responding correctly."
    click_on "Submit Feedback"

    assert_text "Feedback submitted successfully. Thank you for your help in making Nexus AI better!"
  end

  test "export functionality" do
    visit chat_session_url(chat_sessions(:one))
    click_on "Export"

    assert_response_download "chat_session_#{chat_sessions(:one).id}.json"
  end

  test "error-page reporting" do
    ErrorNotifierService.stubs(:call) # Stub the error notifier to prevent actual logging

    # Simulate a 500 error page
    visit "/500"
    assert_text "Internal Server Error"
    
    assert_difference("Feedback.count") do
      click_on "Report this error"
    end

    assert_text "Feedback submitted successfully."
  end
