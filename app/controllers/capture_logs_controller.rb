class CaptureLogsController < ApplicationController
  def index
    @capture_logs = current_user.capture_logs.order(created_at: :desc)
    @capture_log = CaptureLog.new
  end

  def create
    @capture_log = current_user.capture_logs.new(capture_log_params)
    if @capture_log.save
      redirect_to capture_logs_path, notice: "Capture log saved."
    else
      @capture_logs = current_user.capture_logs.order(created_at: :desc)
      render :index, status: :unprocessable_entity
    end
  end

  private

  def capture_log_params
    params.require(:capture_log).permit(:title, :content)
  end
end
