/* eslint-disable no-console */
function fallbackPaste() {
  const fallbackTextarea = document.createElement('textarea');
  document.body.appendChild(fallbackTextarea);
  fallbackTextarea.focus();
  document.execCommand('paste');
  document.body.removeChild(fallbackTextarea);
}

export function handlePaste() {
  document.addEventListener('paste', (event: ClipboardEvent) => {
    if (event.clipboardData) {
      const data = event.clipboardData.getData('text/html');
      console.log('Pasted data:', data);
    }
  });

  fallbackPaste();
}
