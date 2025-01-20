import { mapChildProperties } from '../mappers/mapChildProperties';
import { extractFillColor } from './extractFillColor';
import { extractImageBytes } from './extractImageBytes';
import { extractStrokeColor } from './extractStrokeColor';

export async function extractBaseProperties(node: SceneNode) {
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
    radius: (node as FrameNode).bottomLeftRadius
      === (node as FrameNode).bottomRightRadius
      && (node as FrameNode).topLeftRadius
      === (node as FrameNode).topRightRadius
      ? (node as FrameNode).bottomLeftRadius
      : 0,
    strokeWidth: (node as FrameNode).strokes[0] ? (node as FrameNode).strokeWeight : 0,
    strokeColor: extractStrokeColor(node),
    imageBytes: await extractImageBytes(node),
    fillColor: extractFillColor(node),
    children: 'children' in node ? await Promise.all(node.children.map(mapChildProperties)) : [],
  };
}
