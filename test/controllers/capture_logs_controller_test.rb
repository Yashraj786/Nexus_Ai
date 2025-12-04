require "test_helper"

class CaptureLogsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    sign_in @user
  end

  test "should get index" do
    get capture_logs_url
    assert_response :success
  end

  test "should create capture_log" do
    assert_difference("CaptureLog.count") do
      post capture_logs_url, params: { capture_log: { content: "Test log", title: "Test" } }
    end
    assert_redirected_to capture_logs_path
  end
end
