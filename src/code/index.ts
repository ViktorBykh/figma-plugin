import { copyToClipboard } from './copyToClipboard';

figma.showUI(__html__, { width: 320, height: 150 });

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'copying':
      await copyToClipboard();
      break;
  }
};
