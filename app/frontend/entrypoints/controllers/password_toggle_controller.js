// app/javascript/controllers/password_toggle_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "eyeIcon"]

  toggle() {
    const isPassword = this.inputTarget.type === "password"
    this.inputTarget.type = isPassword ? "text" : "password"
    this.updateIcon(!isPassword)
  }

  updateIcon(isVisible) {
    // Change icon between eye and eye-off
    if (this.eyeIconTarget) {
      this.eyeIconTarget.setAttribute("data-lucide", isVisible ? "eye-off" : "eye")
      // Reinitialize lucide icons
      if (window.lucide) {
        lucide.createIcons()
      }
    }
  }
}
