# frozen_string_literal: true

# Enhanced logging configuration for production monitoring
# Provides structured logging with proper tagging

if Rails.env.production?
  # Use JSON logging for better parsing in production log aggregators
  Rails.logger = ActiveSupport::Logger.new(STDOUT)
  Rails.logger.formatter = proc do |severity, datetime, progname, msg|
    {
      timestamp: datetime.iso8601,
      severity: severity,
      progname: progname,
      message: msg,
      environment: Rails.env
    }.to_json + "\n"
  end

  # Set appropriate log level
  Rails.logger.level = Logger::INFO
else
  # Colorful output for development
  Rails.logger.level = Logger::DEBUG
end
