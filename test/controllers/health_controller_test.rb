# test/controllers/health_controller_test.rb
require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "should get health status ok" do
    HealthController.any_instance.stubs(:check_database).returns(true)
    HealthController.any_instance.stubs(:check_redis).returns(true)
    HealthController.any_instance.stubs(:check_ai_api_key).returns(true)

    get health_check_url
    assert_response :ok
    json_response = JSON.parse(response.body)
    assert_equal true, json_response["database"]
    assert_equal true, json_response["redis"]
    assert_equal true, json_response["ai_api_key"]
  end

  test "should get health status service_unavailable if database fails" do
    HealthController.any_instance.stubs(:check_database).returns(false)
    HealthController.any_instance.stubs(:check_redis).returns(true)
    HealthController.any_instance.stubs(:check_ai_api_key).returns(true)

    get health_check_url
    assert_response :service_unavailable
    json_response = JSON.parse(response.body)
    assert_equal false, json_response["database"]
  end

  test "should get health status service_unavailable if redis fails" do
    HealthController.any_instance.stubs(:check_database).returns(true)
    HealthController.any_instance.stubs(:check_redis).returns(false)
    HealthController.any_instance.stubs(:check_ai_api_key).returns(true)

    get health_check_url
    assert_response :service_unavailable
    json_response = JSON.parse(response.body)
    assert_equal false, json_response["redis"]
  end

  test "should get health status service_unavailable if AI API key is missing" do
    HealthController.any_instance.stubs(:check_database).returns(true)
    HealthController.any_instance.stubs(:check_redis).returns(true)
    HealthController.any_instance.stubs(:check_ai_api_key).returns(false)

    get health_check_url
    assert_response :service_unavailable
    json_response = JSON.parse(response.body)
    assert_equal false, json_response["ai_api_key"]
  end

  def teardown
    mocha_teardown
  end
end
