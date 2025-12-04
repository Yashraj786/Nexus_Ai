import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  static targets = ["source"]
  static values = {
    title: String,
    persona: String,
    restoreUrl: String
  }

  copy(event) {
    event.preventDefault()
    const button = event.currentTarget
    
    let markdownContent = `# Chat Session: ${this.titleValue}\n\n`;
    markdownContent += `**Persona:** ${this.personaValue}\n`;
    markdownContent += `**Date:** ${new Date().toISOString()}\n`;
    markdownContent += `**Restore Link:** ${this.restoreUrlValue}\n\n---\n\n`;

    const messageElements = this.sourceTarget.querySelectorAll('.message');
    
    messageElements.forEach(msg => {
      const role = msg.dataset.role;
      const content = msg.dataset.content;
      markdownContent += `**${role.charAt(0).toUpperCase() + role.slice(1)}**\n${content}\n\n`;
    });

    navigator.clipboard.writeText(markdownContent).then(() => {
      this.showToast('✓ Copied to clipboard!', 'success');
      window.open('https://keep.google.com/', '_blank');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.showToast('✗ Failed to copy', 'error');
    });
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}