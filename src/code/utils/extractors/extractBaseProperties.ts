import { mapChildProperties } from '../mappers/mapChildProperties';
import { extractFillColor } from './extractFillColor';

export function extractBaseProperties(node: SceneNode): any {
  const { id, name, type, width, height, x, y } = node;
  return {
    id,
    name,
    type,
    width,
    height,
    x,
    y,
    opacity: (node as FrameNode).opacity ?? 1,
    rotation: (node as FrameNode).rotation ?? 0,
    fillColor: extractFillColor(node),
    children: 'children' in node ? node.children.map(mapChildProperties) : [],
  };
}
