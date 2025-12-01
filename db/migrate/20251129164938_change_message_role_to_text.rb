class ChangeMessageRoleToText < ActiveRecord::Migration[8.1]
  def change
    change_column :messages, :role, :string
  end
end
