# test/system/regression_test.rb
require "application_system_test_case"

class RegressionTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    sign_in @user
  end

  test "basic chat flow" do
    visit new_chat_session_url
    assert_text "Select AI Persona"
    click_button "developer"

    assert_text "DEVELOPER"

    fill_in placeholder: "Ask anything...", with: "Hello AI"
    # Click the submit button (arrow-up icon button) in the message form
    find('div.relative.flex.items-end.gap-3 button[type="submit"]').click

    # Message should appear in chat
    assert_text "Hello AI"
    # AI is processing the message
    assert_text "The AI is taking longer than usual; retrying safely…"
  end

  test "feedback submission and reporting" do
    visit chat_session_url(chat_sessions(:one))
    click_link "Report"

    assert_text "Report a Problem for Chat Session:"
    select "Bug", from: "Category"
    select "High", from: "Priority"
    fill_in "What went wrong or what would you like to report?", with: "The AI is not responding correctly."
    click_on "Submit Feedback"

    assert_text "Feedback submitted successfully. Thank you for your help in making Nexus AI better!"
  end

  test "export functionality" do
    visit chat_session_url(chat_sessions(:one))
    # Just verify the Export button exists and is clickable
    assert_button "Export"
    click_button "Export"
    # Export functionality triggered without errors
  end

   test "error-page reporting" do
     ErrorNotifierService.stubs(:call) # Stub the error notifier to prevent actual logging

     # Simulate a 500 error page
     visit "/500"
     assert_text "We're sorry, but something went wrong"
   end
end
