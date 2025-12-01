class RemoveRoleDefaultFromMessages < ActiveRecord::Migration[8.1]
  def change
    change_column_default :messages, :role, from: "0", to: nil
  end
end
