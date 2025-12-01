class AddMessagesCountToChatSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :chat_sessions, :messages_count, :integer
  end
end
