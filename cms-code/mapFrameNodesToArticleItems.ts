import type { ImageItem, ItemAny, Layout, RichTextItem } from '@cntrl-pkg/domain';
import { AreaAnchor, ArticleItemType, PositionType, TextTransform, VerticalAlign } from '@cntrl-pkg/domain';
import { CntrlColor } from '@cntrl-site/color';
import { ArticleFilesUploader } from '../ArticleFilesUploader/ArticleFilesUploader';
import { UploadParams } from 'cms-client/view/article/AddMedia/AddArticleFile';
import { EditorViewModel } from 'cms-client/domain/editor/features/EditorViewModel';

function mapTextAlignVertical(align: string) {
  switch (align) {
    case 'center':
      return 'unset';
    case 'top':
      return 'super';
    case 'bottom':
      return 'sub';
    default:
      return 'unset';
  }
}

let topLevelFrameWidth: number | null = null;
let topLevelFrameHeight: number | null = null;

async function mapFigmaNodeToItemSchema(
  frameNode: any,
  layouts: Layout[] | undefined,
  // vm: EditorViewModel
): Promise<{ items: ItemAny[]; fileMap?: Map<string, File> } | null> {
  const result: { items: ItemAny[]; fileMap?: Map<string, File> } | null = { items: [], fileMap: new Map<string, File>() };
  if (!layouts) return null;

  const itemType = mapFigmaNodeTypeToArticleItemType(frameNode.type);

  if (itemType === ArticleItemType.RichText) {
    const richTextItem = mapToRichTextItem(frameNode, layouts);
    result.items?.push(richTextItem);
    return result;
  }

  const area: { [key: string]: any } = {};
  const layoutParams: { [key: string]: any } = {};
  const itemsIds: string[] = [];

  if (frameNode.isTopLevelFrame && topLevelFrameWidth === null) {
    topLevelFrameWidth = frameNode.width;
    topLevelFrameHeight = frameNode.height;
  }

  layouts?.forEach((layout) => {
    const layoutId = layout.id;
    area[layoutId] = {
      top: frameNode.isTopLevelFrame ? 0 : frameNode.y / layout.exemplary,
      left: frameNode.isTopLevelFrame ? 0 : frameNode.x / layout.exemplary,
      width: widthCalculation(topLevelFrameWidth, frameNode, layout),
      height: heightCalculation(topLevelFrameHeight, frameNode, layout),
      zIndex: frameNode.zIndex || 2,
      angle: frameNode.rotation || 0,
      positionType: PositionType.SectionBased,
      scale: 1,
      scaleAnchor: AreaAnchor.MiddleCenter,
    };

    layoutParams[layoutId] = {
      backdropBlur: 0,
      blur: 0,
      blurMode: frameNode.blurMode === 'LAYER_BLUR' || frameNode.blurMode === 'BACKGROUND_BLUR'
        ? 'backdrop'
        : 'default',
      color: frameNode.fillColor && CntrlColor.parse(frameNode.fillColor).fmt('oklch'),
      fillColor: frameNode.fillColor && CntrlColor.parse(frameNode.fillColor).fmt('oklch'),
      fontSize: frameNode.fontSize / layout.exemplary || 16,
      fontStyle: frameNode.fontStyle || 'normal',
      fontVariant: 'normal',
      fontWeight: frameNode.fontWeight || 400,
      letterSpacing: frameNode.letterSpacing || 0,
      lineHeight: frameNode.lineHeight / layout.exemplary || 1.5,
      lineHeightLock: false,
      opacity: frameNode.opacity ?? 0,
      preset: 'default',
      radius: frameNode.radius / layout.exemplary || 0,
      sizing: frameNode.textAutoResize || 'manual',
      strokeColor: frameNode.strokeColor ? CntrlColor.parse(frameNode.strokeColor).fmt('oklch') : 'oklch(0 0 0 / 0)',
      strokeWidth: frameNode.strokeWidth / layout.exemplary || 0,
      textAlign: frameNode.textAlignHorizontal || 'left',
      textTransform: 'none',
      typeFace: frameNode.fontFamily || 'Arial',
      verticalAlign: mapTextAlignVertical(frameNode.textAlignVertical),
      wordSpacing: 0,
    };
  });

  if (itemType === ArticleItemType.Group) {
    if (frameNode.children && frameNode.children.length > 0) {
      frameNode.children.forEach((childNode: any) => {
        itemsIds.push(childNode.id);
      });
    }

    if (frameNode.fillColor) {
      const rectangle = getFrameAsRectangle(frameNode, layouts, layoutParams);
      if (rectangle) {
        itemsIds.push(rectangle.id);
        result.items?.push(rectangle);
      }
    }

    if (frameNode.imageBytes || frameNode.vectorPath) {
      const imageResult = await getFrameAsImage(frameNode, layouts, layoutParams);
      if (imageResult) {
        const { imageItem, imageItemMap } = imageResult;
        if (imageItem) {
          itemsIds.push(imageItem.id);
          result.items?.push(imageItem);
          imageItemMap.forEach((file, key) => {
            result.fileMap?.set(key, file);
          });
        }
      }
    }
  }

  const mappedItem = {
    id: frameNode.id,
    sticky: layouts.reduce((acc: { [key: string]: any }, layout) => {
      acc[layout.id] = null;
      return acc;
    }, {}),
    area,
    layoutParams,
    label: frameNode.name || 'Unnamed Frame',
    hidden: {},
    commonParams: {
      ratioLock: false,
      text: frameNode.characters || '',
      blocks: frameNode.characters?.length > 0
        ? [
            {
              start: 0,
              end: frameNode.characters.length,
              type: 'unstyled',
              entities: []
            }
          ]
        : [],
      name: frameNode.name || 'Unnamed Frame',

      FXControls: [],
      fragmentShader: null,
      hasGLEffect: false,
      // ratioLock: true,
      shaderName: null,
      url: 'none',
    },
    type: itemType,
    itemsIds,
    state: { hover: {} },
  };
  result.items?.push(mappedItem);

  return result;
}

function mapFigmaNodeTypeToArticleItemType(nodeType: string): ArticleItemType {
  switch (nodeType) {
    case 'TEXT': return ArticleItemType.RichText;
    case 'LINE':
    case 'RECTANGLE': return ArticleItemType.Rectangle;
    case 'VECTOR':
    case 'IMAGE': return ArticleItemType.Image;
    case 'VIDEO': return ArticleItemType.Video;
    case 'INSTANCE':
    case 'BOOLEAN_OPERATION':
    case 'FRAME':
    case 'GROUP':
      return ArticleItemType.Group;
    default: return ArticleItemType.Custom;
  }
}

function getFrameAsRectangle(
  frameNode: any,
  layouts: Layout[],
  layoutParams: { [key: string]: any },
) {
  const area: { [key: string]: any } = {};
  layouts.forEach((layout) => {
    area[layout.id] = {
      top: 0,
      left: 0,
      width: widthCalculation(topLevelFrameWidth, frameNode, layout),
      height: frameNode.height / layout.exemplary || 0,
      zIndex: frameNode.zIndex || 2,
      angle: frameNode.rotation || 0,
      positionType: PositionType.SectionBased,
      scale: 1,
      scaleAnchor: AreaAnchor.MiddleCenter,
    };
  });
  return {
    id: `${frameNode.id}-rectangle`,
    sticky: layouts.reduce((acc: { [key: string]: any }, layout) => {
      acc[layout.id] = null;
      return acc;
    }, {}),
    area,
    layoutParams,
    label: frameNode.name || 'Unnamed Frame',
    hidden: {},
    commonParams: {
      ratioLock: false,
      text: frameNode.characters || '',
      blocks: frameNode.characters?.length > 0
        ? [
            {
              start: 0,
              end: frameNode.characters.length,
              type: 'unstyled',
              entities: []
            }
          ]
        : [],
      name: frameNode.name || 'Unnamed Frame',

      FXControls: [],
      fragmentShader: null,
      hasGLEffect: false,
      shaderName: null,
      url: 'none',
    },
    type: ArticleItemType.Rectangle,
    state: { hover: {} },
  };
}

export async function mapFrameNodesToArticleItems(
  frameNodes: any[],
  layouts: Layout[] | undefined,
  // filesUploader: ArticleFilesUploader,
  // vm: EditorViewModel
): Promise<{ items: ItemAny[]; fileMap?: Map<string, File> } | null> {
  if (!layouts || frameNodes.length === 0) return null;

  const mappedArticleItems: { items: ItemAny[]; fileMap?: Map<string, File> } | null = { items: [], fileMap: new Map<string, File>() };

  async function recursivelyMapNode(node: any) {
    const mappedItems = await mapFigmaNodeToItemSchema(node, layouts);
    if (mappedItems) {
      mappedArticleItems?.items.push(...mappedItems.items);
      mappedItems.fileMap?.forEach((file, key) => {
        mappedArticleItems?.fileMap?.set(key, file);
      });
    }

    if (node.children && node.children.length > 0) {
      for (const childNode of node.children) {
        await recursivelyMapNode(childNode);
      }
    }
  }

  for (const frameNode of frameNodes) {
    await recursivelyMapNode(frameNode);
  }

  return mappedArticleItems;
}

function mapToRichTextItem(textNode: any, layouts: Layout[]): RichTextItem {
  const richTextItems: RichTextItem = {
    area: {},
    commonParams: {
      blocks: textNode.characters?.length > 0
        ? [
            {
              data: {},
              end: textNode.characters.length,
              entities: [],
              start: 0,
              type: 'unstyled',
            }
          ]
        : [],
      text: textNode.characters || '',
    },
    hidden: {},
    id: textNode.id,
    label: textNode.name || 'Unnamed Text',
    layoutParams: {},
    state: {},
    sticky: {},
    type: ArticleItemType.RichText,
  };

  layouts.forEach((layout) => {
    richTextItems.area[layout.id] = {
      angle: textNode.rotation || 0,
      height: textNode.height / layout.exemplary || 0,
      left: textNode.x / layout.exemplary || 0,
      positionType: PositionType.SectionBased,
      scale: 1,
      scaleAnchor: AreaAnchor.MiddleCenter,
      top: textNode.y / layout.exemplary || 0,
      width: widthCalculation(topLevelFrameWidth, textNode, layout),
      zIndex: textNode.zIndex || 2,
    };
    richTextItems.layoutParams[layout.id] = {
      blur: 0,
      color: textNode.fillColor && CntrlColor.parse(textNode.fillColor).fmt('oklch'),
      fontSize: textNode.fontSize / layout.exemplary || 16,
      fontStyle: textNode.fontStyle.toLowerCase().includes('italic') ? 'italic' : '',
      fontVariant: 'unset',
      fontWeight: textNode.fontWeight || 400,
      letterSpacing: textNode.letterSpacing / layout.exemplary || 0,
      lineHeight: textNode.lineHeight / layout.exemplary || textNode.fontSize / layout.exemplary,
      lineHeightLock: false,
      preset: 'default',
      sizing: 'auto manual',
      textAlign: textNode.textAlignHorizontal || 'left',
      textTransform: TextTransform.None,
      typeFace: textNode.fontFamily || 'Arial',
      verticalAlign: VerticalAlign.Unset,
      wordSpacing: 0,
    };
  });

  return richTextItems;
}

async function uploadImage(
  imageFile: File,
  filesUploader: ArticleFilesUploader,
  vm: EditorViewModel,
) {
  try {
    const assetId = await vm.addAsset(imageFile);

    const uploadedImageParams: UploadParams = {
      type: ArticleItemType.Image,
      assetId,
      name: imageFile.name,
    };

    await filesUploader.uploadFile([uploadedImageParams]);

    return assetId;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

async function getFrameAsImage(
  imageNode: any,
  layouts: Layout[],
  layoutParams: { [key: string]: any },
) {
  const area: { [key: string]: any } = {};
  layouts.forEach((layout) => {
    area[layout.id] = {
      top: 0,
      left: 0,
      width: widthCalculation(topLevelFrameWidth, imageNode, layout),
      height: imageNode.height / layout.exemplary || 0,
      zIndex: imageNode.zIndex || 2,
      angle: imageNode.rotation || 0,
      positionType: PositionType.SectionBased,
      scale: 1,
      scaleAnchor: AreaAnchor.MiddleCenter,
    };
  });
  const imageItemMap = new Map<string, File>();

  const imageFile = await getImageFile(imageNode);
  if (!imageFile) return;
  imageItemMap.set(`${imageNode.id}-image`, imageFile);

  // const assetId = await vm.addAsset(imageFile);
  // await vm.uploadAsset(assetId);
  // const assetUrl = vm.getAssetRenderUrl(assetId);
  const imageItem: ImageItem = {
    area,
    commonParams: {
      FXControls: [],
      fragmentShader: null,
      hasGLEffect: false,
      ratioLock: true,
      shaderName: null,
      url: 'none',
    },
    hidden: {},
    id: `${imageNode.id}-image`,
    label: imageNode.name || 'Unnamed Text',
    layoutParams,
    state: {},
    sticky: {},
    type: ArticleItemType.Image,
  };

  return { imageItem, imageItemMap };
}

async function getImageFile(imageNode: any) {
  return imageNode.type === 'VECTOR'
    ? getImageSVGFile(imageNode)
    : getImagePNGFile(imageNode);
}

function getImagePNGFile(imageNode: any) {
  const imageBytes = Uint8Array.from(Object.values(imageNode.imageBytes));
  if (!imageBytes) return;

  const imageBlob = new Blob([imageBytes.buffer], { type: 'image/png' });
  const imageFile = new File([imageBlob], 'Uploaded Image', { type: imageBlob.type });
  return imageFile;
}

function getImageSVGFile(imageNode: any) {
  const svgPath = imageNode.vectorPaths[0].data;
  if (!svgPath) return;
  const svgContent = `
      <svg width=${imageNode.width} height=${imageNode.height} viewBox="0 0 ${imageNode.width} ${imageNode.height}">
          <path d="${svgPath}" fill=${imageNode.fillColor} stroke="black" />
      </svg>
  `;

  const imageBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const imageFile = new File([imageBlob], 'Uploaded Image', { type: imageBlob.type });
  return imageFile;
}

function widthCalculation(topLevelFrameWidth: number | null, currentNode: any, layout: Layout) {
  if (currentNode.isTopLevelFrame) return currentNode.width / layout.exemplary || 0;

  if (topLevelFrameWidth && (currentNode.width + currentNode.x) > topLevelFrameWidth) {
    const dx = (currentNode.width + currentNode.x) - topLevelFrameWidth;
    return (currentNode.width - dx) / layout.exemplary || 0;
  }
  return currentNode.width / layout.exemplary || 0;
}

function heightCalculation(topLevelFrameHeight: number | null, currentNode: any, layout: Layout) {
  if (currentNode.isTopLevelFrame) return currentNode.height / layout.exemplary || 0;

  if (topLevelFrameHeight && (currentNode.height + currentNode.y) > topLevelFrameHeight) {
    const dy = (currentNode.height + currentNode.y) - topLevelFrameHeight;
    return (currentNode.height - dy) / layout.exemplary || 0;
  }
  return currentNode.height / layout.exemplary || 0;
}
