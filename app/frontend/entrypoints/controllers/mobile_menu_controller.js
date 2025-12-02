// app/javascript/controllers/mobile_menu_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["overlay"]

  toggle() {
    const sidebar = document.querySelector('[data-sidebar-target="menu"]')
    if (sidebar) {
      sidebar.classList.toggle("hidden")
      this.overlayTarget.classList.toggle("hidden")
    }
  }

  close() {
    const sidebar = document.querySelector('[data-sidebar-target="menu"]')
    if (sidebar) {
      sidebar.classList.add("hidden")
      this.overlayTarget.classList.add("hidden")
    }
  }
}
