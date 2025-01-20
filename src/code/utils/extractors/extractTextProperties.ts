export function extractTextProperties(node: TextNode) {
  return {
    characters: node.characters,
    fontSize: node.fontSize,
    fontName: node.fontName,
    letterSpacing: node.letterSpacing !== figma.mixed ? node.letterSpacing.value : 0,
    lineHeight: node.lineHeight !== figma.mixed && (node.lineHeight.unit === 'PERCENT')
      ? (typeof node.lineHeight === 'object' && 'value' in node.lineHeight && typeof node.fontSize === 'number'
          ? (node.lineHeight.value * node.fontSize) / 100
          : node.fontSize)
      : (typeof node.lineHeight === 'object' && 'value' in node.lineHeight
          ? node.lineHeight.value
          : node.fontSize),
    fontFamily: (node.fontName as FontName).family,
    fontStyle: (node.fontName as FontName).style,
    fontWeight: node.fontWeight,
    textAlignHorizontal: node.textAlignHorizontal.toLowerCase(),
    textAlignVertical: node.textAlignVertical.toLowerCase(),
    textAutoResize: node.textAutoResize.toLowerCase(),
    radius: node.effects.length > 0 ? node.effects[0].radius : 0,
    blurMode: node.effects.length > 0 ? node.effects[0].type.toLowerCase() : '',
    strokeWeight: node.strokeWeight,
  };
}
