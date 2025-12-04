Rails.application.routes.draw do
  get "favicon.ico", to: "application#favicon"

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  get "/health", to: "health#index", as: :health_check

  # Root and authentication
  root "pages#home"
  devise_for :users, path: "", path_names: { sign_in: :login, sign_out: :logout, sign_up: :register }

    # Settings for API configuration
    get "settings", to: "settings#show"
    patch "settings/api-key", to: "settings#update_api_key", as: :settings_update_api_key
    delete "settings/api-key", to: "settings#clear_api_key", as: :settings_clear_api_key
    patch "settings/fallback-provider", to: "settings#update_fallback_provider", as: :settings_update_fallback_provider
    delete "settings/fallback-provider", to: "settings#clear_fallback_provider", as: :settings_clear_fallback_provider
    post "settings/test-api", to: "settings#test_api", as: :settings_test_api

  # Chat sessions with proper nesting
  resources :chat_sessions, only: [ :index, :show, :new, :create, :destroy, :update ] do
    member do
      get :export
      get :export_status
      get :download
    end

    resources :messages, only: [ :create ], controller: "chat_sessions/messages" do
      member do
        post :retry
      end
    end

    resources :feedbacks, only: [ :new, :create, :show ]
  end

  # Top-level feedback creation endpoint (used by error pages)
  resources :feedbacks, only: [ :create ]

  # Capture logs for debugging (consider removing in production)
  resources :capture_logs, only: [ :index, :create ]

  # API namespace for future API endpoints
  namespace :api do
    post "chat", to: "chat#create"
    namespace :v1 do
      # API routes go here
    end
  end

  namespace :admin do
    resource :dashboard, only: [ :show ]
    resources :feedbacks, only: [ :index ]
    get "api-monitoring", to: "api_monitoring#dashboard", as: :api_monitoring
  end

  # Mount Action Cable
  mount ActionCable.server => "/cable"

  match "/404", to: "errors#not_found", via: :all
  match "/500", to: "errors#internal_server_error", via: :all
end
