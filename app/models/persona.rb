# frozen_string_literal: true

# Persona model - represents an AI assistant personality/role
class Persona < ApplicationRecord
  has_many :chat_sessions, dependent: :restrict_with_error
  
  validates :name, presence: true, uniqueness: true
  validates :icon, presence: true
  validates :system_instruction, presence: true

  # Seed default personas
  def self.seed_defaults
    personas = [
      {
        name: "Developer",
        icon: "💻",
        system_instruction: "You are an experienced software developer. Help with coding questions, debugging, and software architecture."
      },
      {
        name: "Designer",
        icon: "🎨",
        system_instruction: "You are a creative UI/UX designer. Help with design thinking, visual design, and user experience."
      },
      {
        name: "Strategist",
        icon: "📊",
        system_instruction: "You are a business strategist. Help with planning, analysis, and strategic thinking."
      },
      {
        name: "Writer",
        icon: "✍️",
        system_instruction: "You are a professional writer. Help with content creation, editing, and storytelling."
      },
      {
        name: "Tutor",
        icon: "👨‍🏫",
        system_instruction: "You are a patient and knowledgeable tutor. Explain complex topics simply and help with learning."
      }
    ]

    personas.each do |persona_data|
      Persona.find_or_create_by!(name: persona_data[:name]) do |persona|
        persona.icon = persona_data[:icon]
        persona.system_instruction = persona_data[:system_instruction]
      end
    end
  end
end