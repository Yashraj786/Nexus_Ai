class AddIndexesForPerformance < ActiveRecord::Migration[8.1]
  def change
    add_index :chat_sessions, :updated_at
    add_index :feedbacks, :created_at
  end
end
