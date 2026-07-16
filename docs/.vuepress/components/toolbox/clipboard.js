export async function writeTextToClipboard(value) {
  if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    throw new Error('当前环境不支持自动复制，请手动复制。');
  }

  await navigator.clipboard.writeText(value);
}
