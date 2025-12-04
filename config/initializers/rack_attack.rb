# frozen_string_literal: true

# Rate limiting configuration to prevent abuse
# Protects API endpoints from excessive requests

class Rack::Attack
  # Always allow requests from localhost in development
  Rack::Attack.safelist("allow-localhost") do |req|
    "127.0.0.1" == req.ip || "::1" == req.ip if Rails.env.development?
  end

  # Throttle message creation to prevent API abuse
  # Allow 10 messages per minute per user
  throttle("messages/create", limit: 10, period: 1.minute) do |req|
    if req.post? && req.path.end_with?("/messages")
      req.env["warden"]&.user&.id
    end
  end

  # Throttle login attempts
  # Allow 5 login attempts per IP per minute
  throttle("logins/ip", limit: 5, period: 1.minute) do |req|
    if req.path == "/users/sign_in" && req.post?
      req.ip
    end
  end

  # Throttle API requests by IP
  # Allow 100 requests per IP per minute for general traffic
  throttle("req/ip", limit: 100, period: 1.minute, &:ip)

  # Custom response for throttled requests
  self.throttled_responder = lambda do |env|
    [
      429,
      {
        "Content-Type" => "application/json",
        "Retry-After" => "60"
      },
      [ { success: false, error: "Rate limit exceeded. Please try again later." }.to_json ]
    ]
  end

  # Log blocked requests
  ActiveSupport::Notifications.subscribe("rack.attack") do |name, start, finish, request_id, payload|
    req = payload[:request]

    if [ :throttle, :blocklist ].include?(req.env["rack.attack.match_type"])
      Rails.logger.warn "[Rack::Attack] Blocked request from #{req.ip} - Discriminator: #{req.env['rack.attack.matched']}"
    end
  end
end
