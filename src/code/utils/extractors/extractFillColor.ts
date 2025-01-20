import { extractColor } from './extractColor';
import { extractStrokeColor } from './extractStrokeColor';

export function extractFillColor(node: SceneNode): string | null {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    return extractColor(node.fills[0]);
  }
  else if ((node as FrameNode).strokes[0]) {
    return extractStrokeColor(node);
  }
  return null;
}
