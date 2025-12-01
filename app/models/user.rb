# --- User Model ---
# app/models/user.rb
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable

  has_many :chat_sessions, -> { includes(:persona) }, dependent: :destroy, inverse_of: :user
  has_many :messages, through: :chat_sessions
  has_many :feedbacks, dependent: :destroy
  has_many :audit_events, dependent: :destroy
  has_many :capture_logs, dependent: :destroy
  has_many :api_usage_logs, dependent: :destroy

  # Validations
  validates :api_provider, presence: true, if: :api_configured?
  validates :api_model_name, presence: true, if: :api_configured?
  validates :encrypted_api_key, presence: true, if: :api_configured?

  # Supported LLM providers
  SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'gemini', 'ollama', 'custom'].freeze

  ONBOARDING_STEPS = [
    "created_first_session",
    "submitted_feedback",
    "exported_session",
    "viewed_run_metrics"
  ].freeze

  def admin?
    admin
  end

  def feature_enabled?(feature)
    return true if Rails.env.development?
    features&.dig(feature.to_s)
  end

  def onboarding_steps_completed
    onboarding_steps || []
  end

  def complete_onboarding_step(step)
    return if onboarding_steps_completed.include?(step)
    update(onboarding_steps: onboarding_steps_completed + [step])
  end

  def all_onboarding_steps_completed?
    (ONBOARDING_STEPS - onboarding_steps_completed).empty?
  end

  # API Key management methods
  def api_configured?
    api_provider.present? && encrypted_api_key.present? && api_model_name.present?
  end

  def update_api_config(provider, api_key, model_name)
    update(
      api_provider: provider,
      encrypted_api_key: api_key,
      api_model_name: model_name,
      api_configured_at: Time.current
    )
  end

  def clear_api_config
    update(
      api_provider: nil,
      encrypted_api_key: nil,
      api_model_name: nil,
      api_configured_at: nil
    )
  end

  # Fallback provider management
  def fallback_configured?
    fallback_provider.present? && encrypted_fallback_api_key.present? && fallback_model_name.present?
  end

  def update_fallback_config(provider, api_key, model_name)
    update(
      fallback_provider: provider,
      encrypted_fallback_api_key: api_key,
      fallback_model_name: model_name
    )
  end

  def clear_fallback_config
    update(
      fallback_provider: nil,
      encrypted_fallback_api_key: nil,
      fallback_model_name: nil
    )
  end

  # Get fallback provider config
  def fallback_provider_config
    return nil unless fallback_configured?

    {
      provider: fallback_provider,
      api_key: encrypted_fallback_api_key,
      model_name: fallback_model_name
    }
  end
end
