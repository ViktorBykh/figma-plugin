/* eslint-disable no-console */
import { extractBaseProperties } from './utils/extractors/extractBaseProperties';
import { mapChildProperties } from './utils/mappers/mapChildProperties';

export async function copyToClipboard() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify('Please select a frame to export');
    figma.ui.postMessage({ type: 'coping-error' });
    return;
  }

  const frame = selection[0] as FrameNode;
  const frameData = {
    ...extractBaseProperties(frame),
    children: frame.children.map(mapChildProperties),
  };

  console.log('Copied data', frameData);

  figma.ui.postMessage({
    type: 'coping-complete',
    payload: frameData,
  });
}
