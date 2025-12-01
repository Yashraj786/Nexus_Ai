class PagesController < ApplicationController
  skip_before_action :authenticate_user!, only: [:home, :nexus]
  def home
  end

  def nexus
    # Render the nexus view
  end
end
