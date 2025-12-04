import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["form", "saveButton", "saveButtonText", "saveSpinner", "testButton", "apiKey", "errorMessage", "successMessage"];

  submitForm(e) {
    e.preventDefault();
    this.clearMessages();
    this.showLoading(true);

    const formData = new FormData(this.formTarget);
    const provider = document.getElementById("api_provider").value;
    const modelName = document.getElementById("api_model_name").value;
    const apiKey = document.getElementById("api_key").value;

    // Basic client-side validation
    const validation = this.validateForm(provider, modelName, apiKey);
    if (!validation.valid) {
      this.showError(validation.error);
      this.showLoading(false);
      return;
    }

    // Submit via AJAX
    fetch("/settings/api-key", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('input[name="authenticity_token"]').value,
      },
      body: JSON.stringify({
        user: {
          api_provider: provider,
          api_model_name: modelName,
          encrypted_api_key: apiKey,
        },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.showLoading(false);
        if (data.success) {
          this.showSuccess(data.message);
          // Reload page after 2 seconds to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.showError(data.error || "Failed to save API configuration");
        }
      })
      .catch((error) => {
        this.showLoading(false);
        this.showError("An error occurred: " + error.message);
      });
  }

  validateForm(provider, modelName, apiKey) {
    if (!provider) {
      return { valid: false, error: "Please select an AI provider" };
    }

    if (!modelName.trim()) {
      return { valid: false, error: "Please enter a model name" };
    }

    if (!apiKey.trim()) {
      return { valid: false, error: "Please enter your API key" };
    }

    if (apiKey.length < 10) {
      return { valid: false, error: "API key seems too short. Please check it's correct" };
    }

    return { valid: true };
  }

  testConnection(e) {
    e.preventDefault();
    this.clearMessages();
    this.showLoading(true, "test");

    fetch("/settings/test-api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('input[name="authenticity_token"]').value,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.showLoading(false, "test");
        if (data.success) {
          this.showSuccess("✓ API connection successful! You're ready to chat.");
        } else {
          this.showError("Connection failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        this.showLoading(false, "test");
        this.showError("Test failed: " + error.message);
      });
  }

  toggleApiKey(e) {
    e.preventDefault();
    const input = this.apiKeyTarget;
    const button = e.target.closest("button");
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.dataset.lucide = "eye-off";
    } else {
      input.type = "password";
      icon.dataset.lucide = "eye";
    }

    // Reinitialize lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("api-form-errors");
    const errorText = document.getElementById("error-message-text");
    errorText.textContent = message;
    errorDiv.classList.remove("hidden");
  }

  showSuccess(message) {
    const successDiv = document.getElementById("api-success-message");
    successDiv.classList.remove("hidden");
  }

  showLoading(show, target = "save") {
    if (target === "save") {
      const btn = this.saveButtonTarget;
      const text = this.saveButtonTextTarget;
      const spinner = this.saveSpinnerTarget;

      if (show) {
        btn.disabled = true;
        text.classList.add("hidden");
        spinner.classList.remove("hidden");
      } else {
        btn.disabled = false;
        text.classList.remove("hidden");
        spinner.classList.add("hidden");
      }
    } else if (target === "test") {
      const btn = this.testButtonTarget;
      btn.disabled = show;
      btn.classList.toggle("opacity-50", show);
    }
  }

  clearMessages() {
    const errorDiv = document.getElementById("api-form-errors");
    const successDiv = document.getElementById("api-success-message");
    errorDiv?.classList.add("hidden");
    successDiv?.classList.add("hidden");
  }
}
