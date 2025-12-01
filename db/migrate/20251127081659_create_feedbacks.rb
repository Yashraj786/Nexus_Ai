class CreateFeedbacks < ActiveRecord::Migration[8.1]
  def change
    create_table :feedbacks, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :chat_session, null: false, foreign_key: true, type: :uuid
      t.text :message
      t.jsonb :api_events_snapshot

      t.timestamps
    end
  end
end
