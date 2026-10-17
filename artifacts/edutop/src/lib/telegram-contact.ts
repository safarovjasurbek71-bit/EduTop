/** Accept a Telegram nickname while keeping saved contact links clickable. */
export function normalizeTelegramContact(value?: string | null): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (/^@?[a-zA-Z0-9_]{1,32}$/.test(text)) {
    return `https://t.me/${text.replace(/^@/, "")}`;
  }
  if (/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i.test(text)) {
    return text.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, "https://t.me/");
  }
  return text; // The existing server URL validation rejects unsafe links.
}
