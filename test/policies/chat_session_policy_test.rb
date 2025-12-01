# frozen_string_literal: true

require "test_helper"

class ChatSessionPolicyTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @other_user = users(:two)
    @chat_session = chat_sessions(:one) # belongs to user :one
  end

  test "user can view their own chat sessions" do
    assert ChatSessionPolicy.new(@user, @chat_session).show?
  end

  test "user cannot view other user's chat sessions" do
    assert_not ChatSessionPolicy.new(@other_user, @chat_session).show?
  end

  test "user can create chat sessions" do
    new_session = ChatSession.new(user: @user)
    assert ChatSessionPolicy.new(@user, new_session).create?
  end

  test "user can update their own chat sessions" do
    assert ChatSessionPolicy.new(@user, @chat_session).update?
  end

  test "user cannot update other user's chat sessions" do
    assert_not ChatSessionPolicy.new(@other_user, @chat_session).update?
  end

  test "user can destroy their own chat sessions" do
    assert ChatSessionPolicy.new(@user, @chat_session).destroy?
  end

  test "scope returns only user's chat sessions" do
    scope = ChatSessionPolicy::Scope.new(@user, ChatSession.all).resolve

    assert_includes scope, @chat_session
    assert_equal @user.chat_sessions.count, scope.count
  end
end
