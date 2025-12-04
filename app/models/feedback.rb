class Feedback < ApplicationRecord
  belongs_to :user
  belongs_to :chat_session

  MAX_MESSAGE_LENGTH = 1000

  CATEGORIES = { bug: 0, performance: 1, ux_usability: 2, feature_request: 3, ui_issue: 4, other: 5 }.freeze
  PRIORITIES = { low: 0, medium: 1, high: 2 }.freeze

  enum :category, CATEGORIES
  enum :feedback_priority, PRIORITIES

  validates :user, presence: true
  validates :chat_session, presence: true
  validates :message, presence: true, length: { maximum: MAX_MESSAGE_LENGTH }
  validates :category, presence: true, inclusion: { in: CATEGORIES.keys.map(&:to_s) }
  validates :feedback_priority, presence: true, inclusion: { in: PRIORITIES.keys.map(&:to_s) }
  validate :sanitize_message

  def bug?
    category == "bug"
  end

  private

  def sanitize_message
    return if message.blank?

    # Remove dangerous HTML/script tags
    sanitized_content_html = ActionController::Base.helpers.sanitize(
      message,
      tags: [], # No HTML tags allowed
      attributes: []
    )

    # Remove non-printable and control characters, preserving newlines
    final_sanitized_content = sanitized_content_html.gsub(/[^\p{Print}\n\r\t]/, "").strip

    self.message = final_sanitized_content
  end
end
