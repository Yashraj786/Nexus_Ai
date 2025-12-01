class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_session_#{params[:chat_session_id]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
