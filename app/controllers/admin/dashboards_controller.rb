# app/controllers/admin/dashboards_controller.rb
module Admin
  class DashboardsController < ApplicationController
    before_action :authenticate_admin!

    def show
      @metrics = DashboardService.call
    end

    private

    def authenticate_admin!
      redirect_to root_path, alert: 'You are not authorized to view this page.' unless current_user&.admin?
    end
  end
end
