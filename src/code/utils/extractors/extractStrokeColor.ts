export function extractStrokeColor(node: SceneNode): string | null {
  if ((node as FrameNode).strokes[0] && (node as FrameNode).strokes[0].type === 'SOLID') {
    const stroke = (node as FrameNode).strokes[0];
    const { r, g, b } = (stroke as SolidPaint).color;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${stroke.opacity ?? 1})`;
  }
  return null;
}
