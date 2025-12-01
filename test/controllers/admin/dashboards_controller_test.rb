require "test_helper"

class Admin::DashboardsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin_user = users(:one)
    @regular_user = users(:three) # Assuming users(:three) is a regular user
  end

  test "should redirect non-admin users from dashboard" do
    sign_in @regular_user
    get admin_dashboard_url
    assert_redirected_to root_path
    assert_equal 'You are not authorized to view this page.', flash[:alert]
  end

  test "should redirect unauthenticated users from dashboard" do
    get admin_dashboard_url
    assert_redirected_to new_user_session_path # Devise redirects to login page
    assert_equal 'You need to sign in or sign up before continuing.', flash[:alert]
  end

  test "should get dashboard for admin user" do
    @admin_user.update(admin: true) # Ensure the user is an admin
    sign_in @admin_user

    # Stub the DashboardService to return sample data
    DashboardService.stubs(:call).returns({
      time_window_minutes: 60,
      requests_per_minute: 10.0,
      failures_per_minute: 1.0,
      retries_per_minute: 2.0,
      average_latency: 0.5,
      top_error_types: [["Net::ReadTimeout", 10]]
    })

    get admin_dashboard_url
    assert_response :success
    assert_not_nil assigns(:metrics)
  end

  def teardown
    mocha_teardown
  end
end
