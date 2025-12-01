class AddApiKeyConfigToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :api_provider, :string
    add_column :users, :encrypted_api_key, :text
    add_column :users, :api_model_name, :string
    add_column :users, :api_configured_at, :datetime
  end
end
