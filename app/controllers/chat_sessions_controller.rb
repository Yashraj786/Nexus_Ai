class ChatSessionsController < ApplicationController
  before_action :set_chat_session, only: [ :show, :update, :destroy, :export, :export_status, :download ]
  after_action :verify_authorized, except: [ :index, :new, :create, :export, :export_status, :download ]
  after_action :verify_policy_scoped, only: :index

  rescue_from ActiveRecord::StatementInvalid, with: :handle_corrupted_session

  def index
    # Use Pundit scope to ensure users only see their own sessions
    @chat_sessions = policy_scope(ChatSession).includes(:persona).recent
  end


  def show
    authorize @chat_session

    if @chat_session.persona.nil? || @chat_session.messages.nil?
      redirect_to chat_sessions_path, alert: "This chat session is corrupted or incomplete."
      return
    end

    # Eager load messages and persona to prevent N+1 queries
    @messages = @chat_session.messages.includes(:chat_session).order(created_at: :asc)
    @feedbacks = @chat_session.feedbacks.order(created_at: :desc)

    current_user.complete_onboarding_step("viewed_run_metrics")
  end

  def export
    authorize @chat_session
    log_audit_event(@chat_session, "exported_session")
    current_user.complete_onboarding_step("exported_session")

    download_key = "export-#{SecureRandom.uuid}"
    ExportChatSessionJob.perform_later(@chat_session.id, download_key)

    render json: { download_key: download_key, status: "processing" }, status: :accepted
  end

  def export_status
    authorize @chat_session
    download_key = params[:download_key]
    if Rails.cache.exist?(download_key)
      render json: { status: "complete", download_path: download_chat_session_path(@chat_session, download_key: download_key) }
    else
      render json: { status: "processing" }, status: :accepted
    end
  end

  def download
    authorize @chat_session
    download_key = params[:download_key]
    json_data = Rails.cache.read(download_key)

    if json_data
      send_data json_data,
                filename: "chat_session_#{@chat_session.id}.json",
                type: :json
    else
      redirect_to @chat_session, alert: "Export not found or has expired."
    end
  end

  def new
    @personas = Persona.all.order(:name)
    @chat_session = ChatSession.new
  rescue => e
    Rails.logger.error("Error in ChatSessionsController#new: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    @personas = []
  end

  def create
    @persona = Persona.find(params[:persona_id])
    @chat_session = current_user.chat_sessions.build(
      persona: @persona,
      title: "New #{ @persona.name} Chat" # Default title
    )

    authorize @chat_session

    if @chat_session.save
      log_audit_event(@chat_session, "created_session", { persona: @persona.name })
      current_user.complete_onboarding_step("created_first_session")
      redirect_to @chat_session, notice: "Chat session started successfully."
    else
      @personas = Persona.all.order(:name)
      flash.now[:alert] = "Could not start a new session."
      render :new, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    redirect_to new_chat_session_path, alert: "Selected persona not found."
  end

  def update
    authorize @chat_session
    if @chat_session.update(chat_session_params)
      redirect_to @chat_session, notice: "Chat session was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @chat_session
    @chat_session.destroy
    redirect_to chat_sessions_url, notice: "Chat session was successfully destroyed."
  end

  private

  def set_chat_session
    @chat_session = current_user.chat_sessions.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to chat_sessions_path, alert: "Chat session not found."
  end

  def chat_session_params
    params.require(:chat_session).permit(:title)
  end

  def handle_corrupted_session
    redirect_to chat_sessions_path, alert: "This chat session is unavailable or corrupted."
  end
end
