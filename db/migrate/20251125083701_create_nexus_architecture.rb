class CreateNexusArchitecture < ActiveRecord::Migration[7.1]
  def change
    # 1. Enable UUIDs for secure, non-guessable IDs (Standard for Pro Apps)
    enable_extension 'pgcrypto'

    # 2. Users Table (Devise compatible)
    create_table :users, id: :uuid do |t|
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      
      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Trackable (Optional but useful for "Recent Activity" analytics)
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true

    # 3. Personas Table
    # We store these in DB so admins can tweak system prompts without code deploys.
    create_table :personas, id: :uuid do |t|
      t.string :name, null: false          # e.g., "Developer", "Knowledge Coach"
      t.string :icon, null: false          # Lucide icon name e.g., "terminal"
      t.string :color_theme, null: false   # Tailwind color class e.g., "text-green-400"
      t.text :system_instruction, null: false # The "Brain" of the persona
      t.text :description                  # Short description for UI selection
      
      t.timestamps
    end

    # 4. Chat Sessions Table
    # This replaces the Firebase document ID. We use UUIDs for public-facing links.
    create_table :chat_sessions, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :persona, type: :uuid, null: false, foreign_key: true
      t.string :title, default: "New Session"
      t.datetime :last_active_at, index: true # For sorting "Recent Activity" efficiently

      t.timestamps
    end

    # 5. Messages Table
    create_table :messages, id: :uuid do |t|
      t.references :chat_session, type: :uuid, null: false, foreign_key: true
      t.integer :role, default: 0, null: false # 0: user, 1: assistant, 2: system
      t.text :content, null: false

      t.timestamps
    end
  end
end
