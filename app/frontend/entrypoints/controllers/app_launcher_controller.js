// app/javascript/controllers/app_launcher_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  connect() {
    this.toggleClass = this.data.get("class") || "hidden"
  }

  toggle() {
    this.modalTarget.classList.toggle(this.toggleClass)
  }

  hide(event) {
    if (event.target === this.modalTarget) {
      this.modalTarget.classList.add(this.toggleClass)
    }
  }
}
