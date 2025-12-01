# app/services/error_notifier_service.rb
class ErrorNotifierService
  def self.call(exception, context: {})
    Rails.logger.error("ErrorNotifierService: #{exception.class} - #{exception.message}. Context: #{context.inspect}")
    # In a real application, this would integrate with an error tracking service like Sentry or Bugsnag.
  end
end