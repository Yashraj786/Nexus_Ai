class CreateCaptureLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :capture_logs do |t|
      t.string :title
      t.text :content
      t.references :user, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
