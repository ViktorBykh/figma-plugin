export function extractTextProperties(node: TextNode) {
  return {
    characters: node.characters,
    fontSize: node.fontSize,
    fontName: node.fontName,
    letterSpacing: node.letterSpacing !== figma.mixed ? node.letterSpacing.value : 0,
    lineHeight: node.lineHeight !== figma.mixed && 'value' in node.lineHeight ? node.lineHeight.value : 1.5,
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
