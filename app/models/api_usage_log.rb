# frozen_string_literal: true

class ApiUsageLog < ApplicationRecord
  include RateLimiteable

  belongs_to :user

  validates :provider, :model, :status, presence: true
  validates :status, inclusion: { in: %w[success error rate_limited timeout] }

  scope :by_user, ->(user) { where(user: user) }
  scope :by_provider, ->(provider) { where(provider: provider) }
  scope :successful, -> { where(status: 'success') }
  scope :failed, -> { where(status: %w[error timeout]) }
  scope :recent, -> { order(created_at: :desc) }
  scope :today, -> { where('DATE(created_at) = ?', Date.current) }
  scope :this_month, -> { where('EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?', Date.current.year, Date.current.month) }

  class << self
    def log_request(user, provider, model, status: 'success', request_tokens: nil, response_tokens: nil, error_message: nil)
      total_tokens = (request_tokens.to_i + response_tokens.to_i) if request_tokens && response_tokens

      create(
        user: user,
        provider: provider,
        model: model,
        status: status,
        request_tokens: request_tokens,
        response_tokens: response_tokens,
        total_tokens: total_tokens,
        error_message: error_message
      )
    end
  end

  # Calculate usage statistics
  def self.usage_stats(user, provider = nil)
    scope = by_user(user)
    scope = scope.by_provider(provider) if provider

    {
      total_requests: scope.count,
      successful_requests: scope.successful.count,
      failed_requests: scope.failed.count,
      total_tokens_used: scope.sum(:total_tokens).to_i,
      request_tokens: scope.sum(:request_tokens).to_i,
      response_tokens: scope.sum(:response_tokens).to_i,
      success_rate: scope.count > 0 ? (scope.successful.count.to_f / scope.count * 100).round(2) : 0
    }
  end

  def self.today_stats(user, provider = nil)
    scope = by_user(user).today
    scope = scope.by_provider(provider) if provider

    {
      requests_today: scope.count,
      tokens_today: scope.sum(:total_tokens).to_i
    }
  end
end
