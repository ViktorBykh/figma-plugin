export function extractColor(paint: Paint): string {
  if (paint.type === 'SOLID') {
    const { r, g, b } = paint.color;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${paint.opacity ?? 1})`;
  }
  return 'rgba(255, 255, 255, 0)';
}
