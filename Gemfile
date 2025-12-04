source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.1.1"
# Use postgresql as the database for Active Record
gem "pg", "~> 1.5"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 6.4"
# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem "turbo-rails"
gem "yaml", ">= 0.4.0"

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder"
gem "httparty"
# Use Devise for authentication
gem "devise"
# Use Pundit for authorization
gem "pundit", "~> 2.3"
# Rate limiting and throttling
gem "rack-attack", "~> 6.8.0"
# Pagination
gem "pagy"
# Use Redcarpet for Markdown parsing
gem "redcarpet", "~> 3.6"
# Use Redis for caching, session storage, and job queues
gem "redis", "~> 5.0"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 1.2"

gem "gemini-ai"

gem "vite_ruby"


gem "autoprefixer-rails"
gem "simple_form", github: "heartcombo/simple_form"

group :development, :test do
  # See https://github.com/rails/spring
  gem "spring"
  gem "mocha", require: false
  gem "bullet"
  # Code style and security audits
  gem "rubocop-rails-omakase", require: false
  gem "bundler-audit", require: false
  gem "brakeman", require: false
end

group :development do
  # Use pry for debugging
  gem "pry-rails"
  # Use console on exceptions pages
  gem "web-console"
end

group :test do
  # Use byebug for debugging
  gem "byebug"
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem "capybara"
  gem "selenium-webdriver"
end
gem "rails-controller-testing", group: :test
