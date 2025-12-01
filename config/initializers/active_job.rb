# frozen_string_literal: true

# Configure Active Job queue adapter
# Using Solid Queue for production-ready background job processing

Rails.application.configure do
  # Use Solid Queue for job processing
  # config.active_job.queue_adapter = :solid_queue

  # Log job execution
  config.active_job.verbose_enqueue_logs = true if Rails.env.development?

  # Set queue name prefix based on environment
  config.active_job.queue_name_prefix = "nexus_ai_#{Rails.env}"

  # Configure default queue name
  config.active_job.default_queue_name = :default
end
