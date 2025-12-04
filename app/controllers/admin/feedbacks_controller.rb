# frozen_string_literal: true

module Admin
  class FeedbacksController < ApplicationController
    before_action :authenticate_admin!

    def index
      # Use Pagy for efficient pagination to avoid loading all feedbacks
      @pagy, @feedbacks = pagy(
        Feedback.order(created_at: :desc),
        items: 25
      )
    end

    private

    def authenticate_admin!
      return if current_user&.admin?

      redirect_to root_path, alert: "You are not authorized to view this page."
    end
  end
end
