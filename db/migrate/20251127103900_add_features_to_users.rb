class AddFeaturesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :features, :jsonb
  end
end
