class ApplicationController < ActionController::Base
  include Auditable
  # Pundit authorization
  include Pundit::Authorization
  include Devise::Controllers::Helpers # This was added previously, ensure it's still here.

  before_action :authenticate_user!

  # Handle favicon requests gracefully
  def favicon
    send_file Rails.root.join("public", "favicon.ico"), type: "image/x-icon", disposition: "inline"
  end

  # Handle Pundit authorization failures
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def user_not_authorized
    flash[:alert] = "You are not authorized to perform this action."
    redirect_back(fallback_location: root_path)
  end
end
