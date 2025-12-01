# frozen_string_literal: true

module Admin
  class ApiMonitoringController < ApplicationController
    before_action :authenticate_user!
    before_action :check_admin

    def dashboard
      @error_count_last_hour = ApiUsageLog.where(status: %w[error rate_limited timeout])
                                           .where('created_at > ?', 1.hour.ago)
                                           .count
      
      @error_count_last_day = ApiUsageLog.where(status: %w[error rate_limited timeout])
                                          .where('created_at > ?', 1.day.ago)
                                          .count
      
      @recent_errors = ApiUsageLog.where(status: %w[error rate_limited timeout])
                                    .recent
                                    .limit(20)
                                    .includes(:user)
      
      @provider_error_stats = ApiUsageLog.where(status: %w[error rate_limited timeout])
                                          .where('created_at > ?', 1.day.ago)
                                          .group(:provider)
                                          .count
      
      @user_error_stats = ApiUsageLog.where(status: %w[error rate_limited timeout])
                                       .where('created_at > ?', 1.day.ago)
                                       .group(:user_id)
                                       .count
                                       .transform_keys { |user_id| User.find(user_id).email }
    end

    private

    def check_admin
      redirect_to root_path, alert: 'Not authorized' unless current_user.admin?
    end
  end
end
