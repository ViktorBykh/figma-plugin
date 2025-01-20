export async function extractImageBytes(node: SceneNode): Promise<Uint8Array | null> {
  if ('fills' in node && Array.isArray(node.fills)) {
    const fill = node.fills[2];
    if (fill && fill.type === 'IMAGE' && 'imageHash' in fill) {
      const imageHash = fill.imageHash;
      const image = figma.getImageByHash(imageHash);
      if (!image) return null;
      const imageBytes = await image.getBytesAsync();
      if (!imageBytes) return null;

      return imageBytes;
    }
  }
  return null;
}
