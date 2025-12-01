class CreateAuditEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_events, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :chat_session, null: false, foreign_key: true, type: :uuid
      t.string :action
      t.jsonb :metadata

      t.timestamps
    end
  end
end
