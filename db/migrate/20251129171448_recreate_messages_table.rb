class RecreateMessagesTable < ActiveRecord::Migration[8.1]
  def change
    create_table :messages, id: :uuid do |t|
      t.references :chat_session, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false # 'user', 'assistant', or 'system_instruction'
      t.text :content, null: false
      t.jsonb :metadata # Stores tokens, latency, etc.

      t.timestamps
    end
  end
end
