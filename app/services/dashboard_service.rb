# app/services/dashboard_service.rb
class DashboardService
  LOG_FILE = Rails.root.join("log", "api_events.log")
  TIME_WINDOW = 60.minutes

  # --- SLO Definitions ---
  # p95 latency should be less than 3 seconds
  P95_LATENCY_THRESHOLD_S = 3.0
  # Success rate should be at least 99.5%
  SUCCESS_RATE_THRESHOLD = 99.5
  # ---

  def self.call
    new.call
  end

  def call
    return default_metrics unless File.exist?(LOG_FILE)

    events = parse_log_file
    calculate_metrics(events)
  end

  private

  def parse_log_file
    window_start_time = Time.now - TIME_WINDOW
    events = []

    File.foreach(LOG_FILE) do |line|
      begin
        event = JSON.parse(line, symbolize_names: true)
        event_time = Time.iso8601(event[:timestamp])
        events << event if event_time >= window_start_time
      rescue JSON::ParserError, TypeError
        # Ignore malformed lines
      end
    end
    events
  end

  def calculate_metrics(events)
    return default_metrics if events.empty?

    requests = events.count { |e| e[:event] == "request_start" }
    failures = events.count { |e| e[:event] == "request_error" }
    retries = events.count { |e| e[:event] == "job_retry" }

    successful_requests = events.select { |e| e[:event] == "request_end" && e[:success] }
    total_latency = successful_requests.sum { |e| e[:latency].to_f }
    average_latency = successful_requests.any? ? (total_latency / successful_requests.count).round(4) : 0

    latencies = events.select { |e| e[:event] == "request_end" }.map { |e| e[:latency].to_f }.sort
    p95_index = (0.95 * latencies.size).ceil - 1
    p95_latency = p95_index >= 0 ? latencies[p95_index].round(4) : 0

    success_rate = requests > 0 ? ((requests - failures).to_f / requests * 100).round(2) : 100

    error_events = events.select { |e| e[:event] == "request_error" || e[:event] == "job_failure_attempt" }
    error_counts = error_events.group_by { |e| e[:error] }.transform_values(&:count)
    top_error_types = error_counts.sort_by { |_, count| -count }.first(5)

    feedback_metrics = calculate_feedback_metrics

    {
      time_window_minutes: TIME_WINDOW / 60,
      requests_per_minute: (requests.to_f / (TIME_WINDOW / 60)).round(2),
      failures_per_minute: (failures.to_f / (TIME_WINDOW / 60)).round(2),
      retries_per_minute: (retries.to_f / (TIME_WINDOW / 60)).round(2),
      average_latency: average_latency,
      p95_latency: p95_latency,
      success_rate: success_rate,
      slo_p95_latency: {
        value: p95_latency,
        threshold: P95_LATENCY_THRESHOLD_S,
        passed: p95_latency <= P95_LATENCY_THRESHOLD_S
      },
      slo_success_rate: {
        value: success_rate,
        threshold: SUCCESS_RATE_THRESHOLD,
        passed: success_rate >= SUCCESS_RATE_THRESHOLD
      },
      top_error_types: top_error_types
    }.merge(feedback_metrics)
  end

  def calculate_feedback_metrics
    {
      user_reported_issues_7_days: Feedback.where("created_at >= ?", 7.days.ago).count,
      open_incidents: Feedback.order(created_at: :desc).limit(5) # Assuming all feedback are "open" for now
    }
  end

  def default_metrics
    {
      time_window_minutes: TIME_WINDOW / 60,
      requests_per_minute: 0.0,
      failures_per_minute: 0.0,
      retries_per_minute: 0.0,
      average_latency: 0.0,
      p95_latency: 0.0,
      success_rate: 100.0,
      slo_p95_latency: {
        value: 0.0,
        threshold: P95_LATENCY_THRESHOLD_S,
        passed: true
      },
      slo_success_rate: {
        value: 100.0,
        threshold: SUCCESS_RATE_THRESHOLD,
        passed: true
      },
      top_error_types: [],
      user_reported_issues_7_days: 0,
      open_incidents: []
    }
  end
end
