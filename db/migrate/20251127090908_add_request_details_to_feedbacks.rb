class AddRequestDetailsToFeedbacks < ActiveRecord::Migration[8.1]
  def change
    add_column :feedbacks, :request_details, :jsonb
  end
end
