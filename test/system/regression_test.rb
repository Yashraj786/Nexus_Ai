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

    assert_text "Developer"

    # Fill in the message input and submit
    fill_in placeholder: "Message...", with: "Hello AI"

    # Submit the form using JavaScript since Stimulus might intercept the submit
    page.execute_script("document.querySelector('[data-chat-target=\"form\"]').submit()")

    # Give the async submission time to process
    sleep 2

    # Page should still be on the chat page
    assert_text "Developer"
  end

  test "feedback submission and reporting" do
    visit chat_session_url(chat_sessions(:one))
    find('a[title="Report"]').click

    assert_text "Report Feedback"
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
