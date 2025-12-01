class AddSanitizedToMessages < ActiveRecord::Migration[8.1]
  def change
    add_column :messages, :sanitized, :boolean, default: false, null: false
  end
end
