class SettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  # Show settings page
  def show
    @supported_providers = User::SUPPORTED_PROVIDERS
    @api_configured = @user.api_configured?
  end

  # Update API configuration
  def update_api_key
    @user.api_provider = settings_params[:api_provider]
    @user.api_model_name = settings_params[:api_model_name]
    
    # Only update API key if it's provided (for security)
    if settings_params[:encrypted_api_key].present?
      @user.encrypted_api_key = settings_params[:encrypted_api_key]
    end

    if @user.save
      AuditEvent.log_action(@user, 'api_key_updated', { provider: @user.api_provider })
      redirect_to settings_path, notice: 'API configuration updated successfully.'
    else
      redirect_to settings_path, alert: 'Failed to update API configuration.'
    end
  end

  # Clear API configuration
  def clear_api_key
    @user.clear_api_config
    AuditEvent.log_action(@user, 'api_key_cleared', {})
    redirect_to settings_path, notice: 'API configuration cleared.'
  end

  # Test API connection
  def test_api
    unless @user.api_configured?
      render json: { success: false, error: 'API not configured' }, status: :unprocessable_entity
      return
    end

    begin
      client = Ai::LlmClient.new(@user)
      test_context = [
        { 'role' => 'system', 'parts' => [{ 'text' => 'You are a helpful assistant.' }] },
        { 'role' => 'user', 'parts' => [{ 'text' => 'Say "API connection successful" if you receive this message.' }] }
      ]
      
      response = client.generate_content(test_context)
      
      if response[:success]
        render json: { success: true, message: 'API connection successful!', data: response[:data] }
      else
        render json: { success: false, error: response[:error] }, status: :unprocessable_entity
      end
    rescue StandardError => e
      render json: { success: false, error: e.message }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = current_user
  end

  def settings_params
    params.require(:user).permit(:api_provider, :api_model_name, :encrypted_api_key)
  end
end
