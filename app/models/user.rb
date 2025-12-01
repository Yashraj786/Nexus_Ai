# --- User Model ---
# app/models/user.rb
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable

  has_many :chat_sessions, -> { includes(:persona) }, dependent: :destroy, inverse_of: :user
  has_many :capture_logs, dependent: :destroy
  has_many :messages, through: :chat_sessions
  has_many :feedbacks, dependent: :destroy
  has_many :audit_events, dependent: :destroy

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
end
