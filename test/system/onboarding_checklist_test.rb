# test/system/onboarding_checklist_test.rb
require "application_system_test_case"

class OnboardingChecklistTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @user.update(features: { pro_session_analytics: true })
    sign_in @user
  end

   test "visiting the chat sessions index and completing an onboarding step" do
    visit chat_sessions_url

    assert_text "Getting started with Nexus Pro"
    assert_text "Created first session"

    # Mark the onboarding step as complete
    @user.complete_onboarding_step("created_first_session")
    visit chat_sessions_url

    # Verify the step shows as completed with a check circle icon
    assert_selector "i[data-lucide='check-circle']", visible: :all
  end
end
