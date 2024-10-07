function triggerCopyFallback() {
  const fallbackTextarea = document.createElement('textarea');
  document.body.appendChild(fallbackTextarea);
  fallbackTextarea.focus();
  fallbackTextarea.select();
  document.execCommand('copy');
  document.body.removeChild(fallbackTextarea);
}

export async function handleCopy(tree: any) {
  const htmlData = JSON.stringify({
    'application/control-items': tree,
  });

  return new Promise<void>((_resolve, _reject) => {
    document.addEventListener('copy', (event: ClipboardEvent) => {
      event.preventDefault();
      if (!event.clipboardData) return;
      event.clipboardData.setData('text/html', htmlData);
    });
    triggerCopyFallback();
  });
}
