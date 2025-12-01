class AddOnboardingStepsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :onboarding_steps, :jsonb
  end
end
