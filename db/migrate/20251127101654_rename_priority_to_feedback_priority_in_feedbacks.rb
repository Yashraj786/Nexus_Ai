class RenamePriorityToFeedbackPriorityInFeedbacks < ActiveRecord::Migration[8.1]
  def up
    rename_column :feedbacks, :priority, :feedback_priority
  end

  def down
    rename_column :feedbacks, :feedback_priority, :priority
  end
end
