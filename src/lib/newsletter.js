export const NEWSLETTER_OPEN_EVENT = "ns-open-newsletter-modal";

export function openNewsletterModal() {
  window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT));
}
