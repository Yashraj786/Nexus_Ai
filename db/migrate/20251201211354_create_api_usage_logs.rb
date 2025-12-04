class CreateApiUsageLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :api_usage_logs do |t|
      t.uuid :user_id, null: false
      t.string :provider, null: false
      t.string :model, null: false
      t.integer :request_tokens
      t.integer :response_tokens
      t.integer :total_tokens
      t.string :status, null: false, default: 'success'
      t.text :error_message
      t.timestamps

      t.index [ :user_id, :created_at ]
      t.index [ :provider, :created_at ]
      t.foreign_key :users, column: :user_id
    end
  end
end
