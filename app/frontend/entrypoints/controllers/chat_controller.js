import { Controller } from "@hotwired/stimulus"
import consumer from "../channels/consumer"

export default class extends Controller {
   static targets = [ "messages", "input", "form", "retryBanner", "loadingIndicator", "formErrors" ]
   static values = {
     chatSessionId: String,
     maxLength: Number
   }

  connect() {
    this.subscription = consumer.subscriptions.create(
      { channel: "ChatChannel", chat_session_id: this.chatSessionIdValue },
      {
        connected: this._connected.bind(this),
        disconnected: this._disconnected.bind(this),
        received: this._received.bind(this),
      }
    )

    this.inputTarget.addEventListener('input', this.resizeInput.bind(this));
    this.scrollToBottom();
  }

  disconnect() {
    this.subscription?.unsubscribe();
  }

  _connected() {
    console.log(`✓ Connected to ChatChannel for session ${this.chatSessionIdValue}`);
    this.scrollToBottom();
  }

  _disconnected() {
    console.log(`✗ Disconnected from ChatChannel for session ${this.chatSessionIdValue}`);
  }

   _received(data) {
     if (data.turbo_stream) {
       Turbo.renderStreamMessage(data.turbo_stream);
       this.hideLoadingIndicator();
       this.scrollToBottom();
     } else if (data.is_retrying) {
       this.retryBannerTarget.classList.remove('hidden');
       this.showLoadingIndicator();
     } else {
       this.retryBannerTarget.classList.add('hidden');
       this.hideLoadingIndicator();
     }
     
     if (data.error) {
       this.hideLoadingIndicator();
       this.showError(data);
     }
   }

   sendMessage(event) {
     event.preventDefault();

     const form = this.formTarget;
     const input = this.inputTarget;
     const content = input.value.trim();

     if (!content) {
       this.showFormError("Please enter a message");
       return;
     }

     if (content.length > this.maxLengthValue) {
       this.showFormError(`Message is too long (maximum ${this.maxLengthValue} characters)`);
       return;
     }

     this.clearFormErrors();
     this.setFormDisabled(true);
     this.showLoadingIndicator();
     
     // Use requestSubmit() to trigger Turbo Drive to handle the form submission
     form.requestSubmit();

     // Clear the input and reset its height after submission
     input.value = '';
     input.style.height = 'auto';
     this.setFormDisabled(false);
     input.focus();
   }

  resizeInput() {
    this.inputTarget.style.height = 'auto';
    this.inputTarget.style.height = (this.inputTarget.scrollHeight) + 'px';
  }

  scrollToBottom() {
    if (this.hasMessagesTarget) {
      this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight;
    }
  }

   setFormDisabled(disabled) {
     const submitButton = this.formTarget.querySelector('[type="submit"]');
     this.inputTarget.disabled = disabled;
     if (submitButton) {
       submitButton.disabled = disabled;
     }
   }

   showLoadingIndicator() {
     if (this.hasLoadingIndicatorTarget) {
       this.loadingIndicatorTarget.classList.remove('hidden');
       this.scrollToBottom();
     }
   }

   hideLoadingIndicator() {
     if (this.hasLoadingIndicatorTarget) {
       this.loadingIndicatorTarget.classList.add('hidden');
     }
   }

   showFormError(errorMessage) {
     if (this.hasFormErrorsTarget) {
       this.formErrorsTarget.textContent = errorMessage;
       this.formErrorsTarget.classList.remove('hidden');
       setTimeout(() => this.clearFormErrors(), 5000);
     }
   }

   clearFormErrors() {
     if (this.hasFormErrorsTarget) {
       this.formErrorsTarget.classList.add('hidden');
       this.formErrorsTarget.textContent = '';
     }
   }

   showError(data) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4 flex justify-between items-center';
    
    const errorMessage = typeof data === 'string' ? data : data.error;
    errorDiv.textContent = errorMessage;

    if (data.retryable) {
      errorDiv.dataset.messageId = data.message_id;
      const retryButton = document.createElement('button');
      retryButton.className = 'action-chip';
      retryButton.textContent = 'Retry';
      retryButton.addEventListener('click', () => this.retryMessage(data.message_id));
      errorDiv.appendChild(retryButton);
    }

    this.messagesTarget.appendChild(errorDiv);
    this.scrollToBottom();

    if (!data.retryable) {
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }

    retryMessage(message_id) {

      const errorDiv = this.messagesTarget.querySelector(`[data-message-id="${message_id}"]`);

      if (errorDiv) {

        errorDiv.remove();

      }

  

      fetch(`/chat_sessions/${this.chatSessionIdValue}/messages/${message_id}/retry`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content

        }

      })

      .catch(error => {

        console.error('Error retrying message:', error);

        this.showError('Failed to retry message. Please try again.');

      });

    }

  

    export() {

      const exportUrl = `/chat_sessions/${this.chatSessionIdValue}/export`;

      fetch(exportUrl, {

        method: 'GET',

        headers: {

          'Accept': 'application/json',

          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content

        }

      })

      .then(response => response.json())

      .then(data => {

        this.pollExportStatus(data.download_key);

      })

      .catch(error => {

        console.error('Error exporting session:', error);

        this.showError('Failed to export session. Please try again.');

      });

    }

  

    pollExportStatus(downloadKey) {

      const statusUrl = `/chat_sessions/${this.chatSessionIdValue}/export_status?download_key=${downloadKey}`;

      const interval = setInterval(() => {

        fetch(statusUrl, {

          method: 'GET',

          headers: {

            'Accept': 'application/json',

            'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content

          }

        })

        .then(response => response.json())

        .then(data => {

          if (data.status === 'complete') {

            clearInterval(interval);

            window.location.href = data.download_path;

          }

        })

        .catch(error => {

          console.error('Error checking export status:', error);

          clearInterval(interval);

          this.showError('Failed to check export status. Please try again.');

        });

      }, 2000);

    }

  }

  