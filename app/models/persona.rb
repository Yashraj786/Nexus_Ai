# frozen_string_literal: true

# Persona model - represents an AI assistant personality/role
class Persona < ApplicationRecord
  has_many :chat_sessions, dependent: :restrict_with_error
  
  validates :name, presence: true, uniqueness: true
  validates :icon, presence: true
  validates :system_instruction, presence: true
end