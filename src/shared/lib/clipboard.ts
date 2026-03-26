export async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(text);
  return true;
}

export async function readClipboardText(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
    return "";
  }

  return navigator.clipboard.readText();
}
