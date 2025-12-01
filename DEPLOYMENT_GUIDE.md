# 🚀 NEXUS AI - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Background Jobs](#background-jobs)
5. [Security Configuration](#security-configuration)
6. [Deployment Steps](#deployment-steps)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Ruby**: 3.3.5+
- **Rails**: 8.1.1+
- **PostgreSQL**: 14+
- **Redis**: 7+ (for Action Cable and caching)
- **Node.js**: 18+ (for asset compilation)

### Required Services
- **Google Gemini API Key** - [Get it here](https://makersuite.google.com/app/apikey)
- **Domain name** (for production)
- **SSL certificate** (Let's Encrypt recommended)

---

## Environment Setup

### 1. Install Dependencies

```bash
# Install Ruby dependencies
bundle install

# Install JavaScript dependencies
npm install
# or
yarn install

# Install Postgres
brew install postgresql@14  # macOS
# or
sudo apt-get install postgresql-14  # Ubuntu

# Install Redis
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu
```

### 2. Configure Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_ai_production

# Rails
RAILS_ENV=production
RAILS_SERVE_STATIC_FILES=true
RAILS_LOG_TO_STDOUT=true
SECRET_KEY_BASE=your_secret_key_base_here

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Redis (for Action Cable & caching)
REDIS_URL=redis://localhost:6379/0

# Application
HOST=yourdomain.com
PROTOCOL=https

# Email (if using ActionMailer)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_DOMAIN=yourdomain.com

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
```

### 3. Generate Secret Keys

```bash
# Generate SECRET_KEY_BASE
bin/rails secret

# Edit credentials
bin/rails credentials:edit

# Add your Gemini API key to credentials
# google:
#   api_key: YOUR_API_KEY_HERE
```

---

## Database Configuration

### 1. Create Database

```bash
# Development
bin/rails db:create
bin/rails db:migrate

# Production
RAILS_ENV=production bin/rails db:create
RAILS_ENV=production bin/rails db:migrate
```

### 2. Seed Initial Data

```bash
# Create default personas
bin/rails db:seed

# Or manually in console
bin/rails console

> Persona.create!([
>   {
>     name: 'Senior Developer',
>     icon: 'terminal',
>     color_theme: 'text-green-400',
>     description: 'Expert in software development',
>     system_instruction: 'You are a senior software developer with expertise in Ruby on Rails...'
>   },
>   {
>     name: 'Ruby Architect',
>     icon: 'gem',
>     color_theme: 'text-red-500',
>     description: 'Rails architecture specialist',
>     system_instruction: 'You are a Senior Ruby on Rails Architect...'
>   }
> ])
```

### 3. Backup Strategy

```bash
# Automated daily backups
# Add to crontab
0 2 * * * pg_dump nexus_ai_production > /backups/nexus_ai_$(date +\%Y\%m\%d).sql
```

---

## Background Jobs

### Using Solid Queue (Recommended)

```bash
# Start Solid Queue worker
bin/rails solid_queue:start

# Or use systemd service (production)
# Create /etc/systemd/system/nexus-ai-worker.service

[Unit]
Description=Nexus AI Background Worker
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/nexus_ai
Environment=RAILS_ENV=production
ExecStart=/usr/local/bin/bundle exec rails solid_queue:start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Monitor Jobs

```bash
# Check job status in Rails console
bin/rails console

> SolidQueue::Job.all
> SolidQueue::Job.where(queue_name: 'default').pending
```

---

## Security Configuration

### 1. SSL/TLS Setup

```ruby
# config/environments/production.rb
config.force_ssl = true
config.ssl_options = { hsts: { subdomains: true } }
```

### 2. Rate Limiting

Rack::Attack is pre-configured in `config/initializers/rack_attack.rb`

Adjust limits as needed:
```ruby
# 10 messages per minute per user
throttle('messages/create', limit: 10, period: 1.minute)

# 5 login attempts per IP per minute
throttle('logins/ip', limit: 5, period: 1.minute)
```

### 3. Content Security Policy

```ruby
# config/initializers/content_security_policy.rb
Rails.application.config.content_security_policy do |policy|
  policy.default_src :self
  policy.font_src    :self, :data
  policy.img_src     :self, :data, :https
  policy.script_src  :self
  policy.style_src   :self, :unsafe_inline
  policy.connect_src :self, :https
end
```

---

## Deployment Steps

### Option 1: Kamal Deployment (Recommended)

```bash
# Install Kamal
gem install kamal

# Initialize
kamal init

# Configure config/deploy.yml
# Deploy
kamal deploy
```

### Option 2: Traditional Server

```bash
# 1. Clone repository
git clone https://github.com/yourusername/nexus-ai.git
cd nexus-ai

# 2. Install dependencies
bundle install --without development test

# 3. Precompile assets
RAILS_ENV=production bin/rails assets:precompile

# 4. Run migrations
RAILS_ENV=production bin/rails db:migrate

# 5. Start services
bin/rails server -e production -b 0.0.0.0
```

### Option 3: Docker

```bash
# Build image
docker build -t nexus-ai .

# Run container
docker run -d \
  --name nexus-ai \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e GOOGLE_API_KEY=... \
  -e SECRET_KEY_BASE=... \
  nexus-ai
```

---

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install monitoring tools (choose one)
gem 'newrelic_rpm'
gem 'skylight'
gem 'scout_apm'

# Or use open-source
gem 'prometheus-client'
```

### 2. Error Tracking

```ruby
# Gemfile
gem 'sentry-ruby'
gem 'sentry-rails'

# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.1
end
```

### 3. Log Management

```bash
# Use log aggregation service
# - Papertrail
# - Loggly
# - CloudWatch (AWS)

# Or configure logrotate
# /etc/logrotate.d/nexus-ai
/var/www/nexus_ai/log/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  copytruncate
}
```

---

## Performance Optimization

### 1. Database Indexing

```bash
# Check for missing indexes
bin/rails db:analyze

# Add indexes as needed
bin/rails generate migration AddIndexToMessages
```

### 2. Caching

```ruby
# Enable caching in production
config.cache_store = :solid_cache_store

# Cache personas
Persona.cached_all  # See app/models/persona.rb

# Fragment caching in views
<% cache @chat_session do %>
  ...
<% end %>
```

### 3. Asset Optimization

```bash
# Ensure assets are fingerprinted
RAILS_ENV=production bin/rails assets:precompile

# Use CDN for static assets (optional)
config.asset_host = 'https://cdn.yourdomain.com'
```

---

## Troubleshooting

### Common Issues

#### 1. Jobs not processing

```bash
# Check Solid Queue status
bin/rails solid_queue:status

# Restart worker
sudo systemctl restart nexus-ai-worker
```

#### 2. API rate limiting

```ruby
# Increase limits in config/initializers/rack_attack.rb
throttle('messages/create', limit: 20, period: 1.minute)
```

#### 3. Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U username -d nexus_ai_production
```

#### 4. Memory issues

```bash
# Monitor memory usage
free -h

# Restart Puma workers
pumactl restart
```

---

## Health Checks

```bash
# Application health
curl https://yourdomain.com/up

# Database health
bin/rails runner "puts ActiveRecord::Base.connection.active? ? 'OK' : 'FAIL'"

# Redis health
redis-cli ping
```

---

## Security Checklist

- [ ] SSL/TLS enabled (`force_ssl = true`)
- [ ] Environment variables secured (never commit `.env`)
- [ ] Database credentials encrypted
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Content Security Policy set
- [ ] Regular security audits (`bundle audit`)
- [ ] Brakeman scans (`brakeman`)
- [ ] Dependencies updated regularly
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts configured

---

## Additional Resources

- [Rails Deployment Guide](https://guides.rubyonrails.org/deployment.html)
- [Kamal Documentation](https://kamal-deploy.org)
- [Solid Queue Guide](https://github.com/basecamp/solid_queue)
- [Pundit Authorization](https://github.com/varvet/pundit)
- [Google Gemini API Docs](https://ai.google.dev/docs)

---

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review application logs: `tail -f log/production.log`

---

**Last Updated**: November 2025
**Version**: 1.0.0
