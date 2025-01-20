import { extractBaseProperties } from './utils/extractors/extractBaseProperties';
import { mapChildProperties } from './utils/mappers/mapChildProperties';

export async function copyToClipboard() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('Please select at least one frame to export');
    const errorMessage = 'An error occurred while copying to clipboard.';
    figma.ui.postMessage({ type: 'copying-error', message: errorMessage });
    return;
  }

  const copiedData = await Promise.all(
    selection.map(async (node) => {
      const baseData = await extractBaseProperties(node);
      const isFrame = node.type === 'FRAME';

      const isTopLevelFrame = isFrame && node.parent?.type === 'PAGE';
      const childProperties
        = isFrame
          ? await Promise.all(node.children.map(mapChildProperties))
          : {};

      return {
        ...baseData,
        ...(isFrame ? { children: childProperties } : {}),
        isTopLevelFrame,
      };
    })
  );

  figma.ui.postMessage({
    type: 'copying-complete',
    payload: copiedData,
  });
}
