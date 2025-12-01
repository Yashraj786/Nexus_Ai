# config/initializers/api_event_logger.rb
require 'logger'

class ApiEventLogger
  # Returns the logger instance, creating it if it doesn't already exist.
  # The logger writes to 'log/api_events.log'.
  # @return [Logger] The logger instance.
  def self.logger
    @logger ||= Logger.new(Rails.root.join('log', 'api_events.log'))
  end

  # Logs a structured event to the 'api_events.log' file.
  # The event is logged as a JSON object, including a timestamp and the event type.
  # @param event [String] The type of event to log (e.g., 'request_start', 'job_success').
  # @param data [Hash] A hash of additional data to include in the log entry.
  def self.log(event, data = {})
    timestamp = Time.now.iso8601
    log_data = { timestamp: timestamp, event: event }.merge(data)
    logger.info(log_data.to_json)
  end
end
