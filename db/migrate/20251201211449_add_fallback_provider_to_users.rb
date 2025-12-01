class AddFallbackProviderToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :fallback_provider, :string
    add_column :users, :encrypted_fallback_api_key, :string
    add_column :users, :fallback_model_name, :string
  end
end
