# app/controllers/errors_controller.rb
class ErrorsController < ApplicationController
  skip_before_action :authenticate_user!

  def not_found
    render status: :not_found
  end

  def internal_server_error
    exception = request.env["action_dispatch.exception"]
    context = { user: current_user.try(:email), params: request.params }
    ErrorNotifierService.call(exception, context: context)
    render status: :internal_server_error
  end
end
