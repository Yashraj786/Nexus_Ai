# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_01_211354) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "api_usage_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error_message"
    t.string "model", null: false
    t.string "provider", null: false
    t.integer "request_tokens"
    t.integer "response_tokens"
    t.string "status", default: "success", null: false
    t.integer "total_tokens"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["provider", "created_at"], name: "index_api_usage_logs_on_provider_and_created_at"
    t.index ["user_id", "created_at"], name: "index_api_usage_logs_on_user_id_and_created_at"
  end

  create_table "audit_events", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "action"
    t.uuid "chat_session_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["chat_session_id"], name: "index_audit_events_on_chat_session_id"
    t.index ["user_id"], name: "index_audit_events_on_user_id"
  end

  create_table "capture_logs", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["user_id"], name: "index_capture_logs_on_user_id"
  end

  create_table "chat_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "last_active_at"
    t.integer "messages_count"
    t.uuid "persona_id", null: false
    t.string "title", default: "New Session"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["last_active_at"], name: "index_chat_sessions_on_last_active_at"
    t.index ["persona_id"], name: "index_chat_sessions_on_persona_id"
    t.index ["updated_at"], name: "index_chat_sessions_on_updated_at"
    t.index ["user_id"], name: "index_chat_sessions_on_user_id"
  end

  create_table "feedbacks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.jsonb "api_events_snapshot"
    t.integer "category"
    t.uuid "chat_session_id", null: false
    t.datetime "created_at", null: false
    t.integer "feedback_priority"
    t.text "message"
    t.jsonb "request_details"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["chat_session_id"], name: "index_feedbacks_on_chat_session_id"
    t.index ["created_at"], name: "index_feedbacks_on_created_at"
    t.index ["user_id"], name: "index_feedbacks_on_user_id"
  end

  create_table "messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "chat_session_id", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["chat_session_id"], name: "index_messages_on_chat_session_id"
  end

  create_table "personas", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "icon", null: false
    t.string "name", null: false
    t.text "system_instruction", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "admin", default: false, null: false
    t.datetime "api_configured_at"
    t.string "api_model_name"
    t.string "api_provider"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.text "encrypted_api_key"
    t.string "encrypted_password", default: "", null: false
    t.jsonb "features"
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.jsonb "onboarding_steps"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "api_usage_logs", "users"
  add_foreign_key "audit_events", "chat_sessions"
  add_foreign_key "audit_events", "users"
  add_foreign_key "capture_logs", "users"
  add_foreign_key "chat_sessions", "personas"
  add_foreign_key "chat_sessions", "users"
  add_foreign_key "feedbacks", "chat_sessions"
  add_foreign_key "feedbacks", "users"
  add_foreign_key "messages", "chat_sessions"
end
