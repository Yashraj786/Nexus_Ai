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
      const originalText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
      window.open('https://keep.google.com/', '_blank');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      button.textContent = "Failed to copy!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  }
}