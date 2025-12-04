import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["testButton"]

  async testApi(event) {
    event.preventDefault()

    const btn = this.testButtonTarget
    const originalHTML = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>Testing...'

    try {
      const response = await fetch(btn.dataset.testUrl, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('input[name="authenticity_token"]').value,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        this.showToast('✅ Connection Successful!\n\n' + data.data, 'success')
      } else {
        this.showToast('❌ Connection Failed\n\n' + data.error, 'error')
      }
    } catch (error) {
      this.showToast('❌ Error Testing API\n\n' + error.message, 'error')
    }

    btn.disabled = false
    btn.innerHTML = originalHTML
    lucide.createIcons()
  }

  showToast(message, type = 'success') {
    // Using alert for now to match original behavior
    // Can be replaced with a proper toast component later
    alert(message)
  }
}
