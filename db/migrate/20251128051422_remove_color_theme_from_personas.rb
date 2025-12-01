class RemoveColorThemeFromPersonas < ActiveRecord::Migration[8.1]
  def change
    remove_column :personas, :color_theme, :string
  end
end
