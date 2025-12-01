class ChatSessions::MessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_chat_session

  def create
    @message = @chat_session.messages.new(message_params.merge(role: 'user'))
    authorize @chat_session, :show? # Pundit ensures user owns the session

    if @message.save
      # Turbo will automatically render the message placeholder and the model callback
      # triggers the AiResponseJob, which handles the final broadcast.
      respond_to do |format|
        format.html { redirect_to @chat_session }
        format.turbo_stream
      end
    else
      render turbo_stream: turbo_stream.replace(
        'new_message_form',
        partial: 'chat_sessions/new_message_form',
        locals: { chat_session: @chat_session, message: @message }
      ), status: :unprocessable_entity
    end
  end

  private

  def set_chat_session
    @chat_session = ChatSession.find(params[:chat_session_id])
  end

  def message_params
    params.require(:message).permit(:content)
  end
end
