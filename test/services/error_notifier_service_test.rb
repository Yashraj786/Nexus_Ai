# test/services/error_notifier_service_test.rb
require "test_helper"

class ErrorNotifierServiceTest < ActiveSupport::TestCase
  test "should log error in structured format" do
    error = StandardError.new("Test error")
    user = users(:one)
    params = { controller: "test", action: "test" }

    # Capture the log output
    log_output = StringIO.new
    Rails.logger = Logger.new(log_output)

    ErrorNotifierService.call(error, context: { user: user.to_s, params: params.to_s })

    # Assert the log output (strip logger prefix if present)
    raw = log_output.string
    assert_match /ErrorNotifierService: StandardError - Test error\./, raw
    assert_match /Context: {:user=>"#<User:.+?>", :params=>"\{:controller=>\\"test\\", :action=>\\"test\\"\}"\}/, raw
  end
end
