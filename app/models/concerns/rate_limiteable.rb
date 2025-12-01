# frozen_string_literal: true

module RateLimiteable
  extend ActiveSupport::Concern

  included do
    RATE_LIMITS = {
      requests_per_minute: 30,
      requests_per_hour: 500,
      requests_per_day: 5000
    }.freeze
  end

  class_methods do
    def check_rate_limit(user)
      now = Time.current

      # Check minute limit
      minute_ago = now - 1.minute
      minute_requests = where(user: user).where('created_at > ?', minute_ago).count
      
      if minute_requests >= RATE_LIMITS[:requests_per_minute]
        return {
          limited: true,
          reason: "You've exceeded the rate limit of #{RATE_LIMITS[:requests_per_minute]} requests per minute",
          reset_in: 60
        }
      end

      # Check hour limit
      hour_ago = now - 1.hour
      hour_requests = where(user: user).where('created_at > ?', hour_ago).count
      
      if hour_requests >= RATE_LIMITS[:requests_per_hour]
        return {
          limited: true,
          reason: "You've exceeded the rate limit of #{RATE_LIMITS[:requests_per_hour]} requests per hour",
          reset_in: 3600
        }
      end

      # Check day limit
      day_ago = now - 1.day
      day_requests = where(user: user).where('created_at > ?', day_ago).count
      
      if day_requests >= RATE_LIMITS[:requests_per_day]
        return {
          limited: true,
          reason: "You've exceeded the rate limit of #{RATE_LIMITS[:requests_per_day]} requests per day",
          reset_in: 86400
        }
      end

      { limited: false }
    end

    def get_user_limits(user)
      now = Time.current

      minute_ago = now - 1.minute
      hour_ago = now - 1.hour
      day_ago = now - 1.day

      minute_count = where(user: user).where('created_at > ?', minute_ago).count
      hour_count = where(user: user).where('created_at > ?', hour_ago).count
      day_count = where(user: user).where('created_at > ?', day_ago).count

      {
        minute: { used: minute_count, limit: RATE_LIMITS[:requests_per_minute], remaining: [0, RATE_LIMITS[:requests_per_minute] - minute_count].max },
        hour: { used: hour_count, limit: RATE_LIMITS[:requests_per_hour], remaining: [0, RATE_LIMITS[:requests_per_hour] - hour_count].max },
        day: { used: day_count, limit: RATE_LIMITS[:requests_per_day], remaining: [0, RATE_LIMITS[:requests_per_day] - day_count].max }
      }
    end
  end
end
