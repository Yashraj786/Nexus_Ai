# app/controllers/health_controller.rb
class HealthController < ApplicationController
  skip_before_action :authenticate_user!, raise: false
  
  def index
    status = {}
    status[:database] = check_database
    status[:redis] = check_redis
    status[:ai_api_key] = check_ai_api_key

    overall_status = status.values.all? ? :ok : :service_unavailable
    render json: status, status: overall_status
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute("SELECT 1")
    true
  rescue StandardError => e
    Rails.logger.error "Health check: Database connection failed - #{e.message}"
    false
  end

  def check_redis
    Redis.new.ping == "PONG"
  rescue StandardError => e
    Rails.logger.error "Health check: Redis connection failed - #{e.message}"
    false
  end

  def check_ai_api_key
    ENV['GOOGLE_API_KEY'].present? || Rails.application.credentials.dig(:google_api_key).present?
  end
end
