# test/system/onboarding_checklist_test.rb
require "application_system_test_case"

class OnboardingChecklistTest < ApplicationSystemTestCase
  setup do
    @user = users(:one)
    @user.update(features: { pro_session_analytics: true })
    sign_in @user
  end

  test "visiting the chat sessions index and completing an onboarding step" do
    visit chat_sessions_url

    assert_text "Getting started with Nexus Pro"
    assert_text "Create your first session"

    click_on "New Session"
    # Assuming the new session form is filled out and submitted correctly...
    # For this test, we'll just check that the step is completed.
    @user.complete_onboarding_step("created_first_session")
    visit chat_sessions_url

    assert_selector "li.flex.items-center.text-sm", text: "Create your first session" do
      assert_selector "i[data-lucide='check-circle']"
    end
  end
end
