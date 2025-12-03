// app/javascript/controllers/password_toggle_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "eyeIcon"]

  toggle(event) {
    // Find the button that was clicked
    const button = event.target.closest("button")
    if (!button) return

    // Find the nearest input field (sibling in the parent relative div)
    const inputElement = button.parentElement.querySelector('input[type="password"], input[type="text"]')
    const iconElement = button.querySelector('[data-password-toggle-target="eyeIcon"]')
    
    if (!inputElement) return

    // Toggle the input type
    const isPassword = inputElement.type === "password"
    inputElement.type = isPassword ? "text" : "password"

    // Update the icon
    if (iconElement) {
      iconElement.setAttribute("data-lucide", isPassword ? "eye-off" : "eye")
      // Reinitialize lucide icons
      if (window.lucide) {
        lucide.createIcons()
      }
    }
  }
}
