# config/initializers/api_logger.rb
require "logger"

class ApiLogger
  def self.logger
    @logger ||= Logger.new(Rails.root.join("log", "api_errors.log"))
  end

  def self.log(message)
    logger.error(message)
  end
end
