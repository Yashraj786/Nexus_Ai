class AddCategoryAndPriorityToFeedbacks < ActiveRecord::Migration[8.1]
  def change
    add_column :feedbacks, :category, :integer
    add_column :feedbacks, :priority, :integer
  end
end
