import { extractTextProperties } from '../extractors/extractTextProperties';
import { mapChildProperties } from './mapChildProperties';

export async function mapSpecificProperties(child: SceneNode): Promise<any> {
  switch (child.type) {
    case 'TEXT':
      return extractTextProperties(child as TextNode);
    case 'VECTOR':
      return { vectorPaths: (child as VectorNode).vectorPaths };
    case 'INSTANCE':
      return {
        mainComponent: (child as InstanceNode).mainComponent?.name,
        componentProperties: (child as InstanceNode).componentProperties,
      };
    case 'BOOLEAN_OPERATION':
      return { booleanOperation: (child as BooleanOperationNode).booleanOperation };
    case 'STAR':
      return {
        pointCount: (child as StarNode).pointCount,
        innerRadius: (child as StarNode).innerRadius,
      };
    case 'LINE':
      return { length: Math.sqrt(child.width ** 2 + child.height ** 2) };
    case 'ELLIPSE':
      return { arcData: (child as EllipseNode).arcData };
    case 'POLYGON':
      return { pointCount: (child as PolygonNode).pointCount };
    case 'FRAME':
    case 'GROUP':
      return {
        layoutMode: (child as FrameNode).layoutMode || null,
        paddingLeft: (child as FrameNode).paddingLeft,
        paddingRight: (child as FrameNode).paddingRight,
        paddingTop: (child as FrameNode).paddingTop,
        paddingBottom: (child as FrameNode).paddingBottom,
        layoutGrids: (child as FrameNode).layoutGrids,
        children: await Promise.all((child as FrameNode).children.map(mapChildProperties)),
      };
    case 'STAMP':
      return { author: (child as StampNode).getAuthorAsync() };
    case 'STICKY':
      return {
        authorName: (child as StickyNode).authorName,
        text: (child as StickyNode).text.characters,
      };
    case 'SHAPE_WITH_TEXT':
      return {
        shapeType: (child as ShapeWithTextNode).shapeType,
        text: (child as ShapeWithTextNode).text.characters,
      };
    case 'CODE_BLOCK':
      return {
        code: (child as CodeBlockNode).code,
        codeLanguage: (child as CodeBlockNode).codeLanguage,
      };
    case 'TABLE':
      return {
        numRows: (child as TableNode).numRows,
        numColumns: (child as TableNode).numColumns,
      };
    case 'CONNECTOR':
      return {
        connectorLineType: (child as ConnectorNode).connectorLineType,
        connectorStart: (child as ConnectorNode).connectorStart,
        connectorEnd: (child as ConnectorNode).connectorEnd,
      };
    case 'MEDIA':
      return { mediaHash: (child as MediaNode).mediaData.hash };
    default:
      return {};
  }
}
