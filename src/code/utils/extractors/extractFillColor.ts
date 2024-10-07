import { extractColor } from './extractColor';

export function extractFillColor(node: SceneNode): string {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    return extractColor(node.fills[0]);
  }
  return 'rgba(255, 255, 255, 0)';
}
