class AuditEvent < ApplicationRecord
  belongs_to :user
  belongs_to :chat_session

  validates :user, presence: true
  validates :chat_session, presence: true
  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
end
