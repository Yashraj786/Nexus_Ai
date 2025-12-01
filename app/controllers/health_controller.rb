# frozen_string_literal: true

class HealthController < ApplicationController
  skip_before_action :authenticate_user!, raise: false

  def index
    status = {}
    
    # Critical: Database connectivity
    status[:database] = check_database
    
    # Optional: Redis connectivity (log but don't fail)
    status[:redis] = check_redis
    
    # Optional: AI API Key (useful but not critical for demo)
    status[:ai_api_key] = check_ai_api_key

    # Only fail if database is down
    overall_status = status[:database] ? :ok : :service_unavailable
    render json: status, status: overall_status
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute('SELECT 1')
    true
  rescue StandardError => e
    Rails.logger.error "Health check: Database connection failed - #{e.message}"
    false
  end

  def check_redis
    begin
      Redis.new.ping == 'PONG'
    rescue StandardError => e
      Rails.logger.warn "Health check: Redis connection failed (non-critical) - #{e.message}"
      false # Redis is optional for development
    end
  end

  def check_ai_api_key
    ENV['GOOGLE_API_KEY'].present? || Rails.application.credentials.dig(:google_api_key).present?
  end
end
