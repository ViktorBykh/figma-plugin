import { ulid } from 'ulid';
import {
  ArticleCommandTypes,
  ArticleItemType,
  GroupItem,
  ItemAny
} from '@cntrl-pkg/domain';
import { useDi } from '../../../root/useDi';
import { editorContext } from '../../../root/article.module';
import { useCallback, useContext, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { SelectionMode } from '../../../domain/article/enum/SelectionMode';
import { useViewModelData } from '../../../core/ViewModel/useViewModelData';
import { ItemDuplicateData } from './useDuplicateItems';
import isEqual from 'lodash.isequal';
import { SectionGeometryContext } from '../SectionGeometry/SectionGeometryContext';
import { getDefaultItemLabelByType, getDuplicatedItemLabel } from '../../utils/getDuplicatedItemLabel';
import {
  ArticleItemsClipboardManager
} from 'cms-client/domain/article/features/ArticleEditor/ArticleItemsClipboardManager';
import { useLayoutManager } from 'cms-client/view/article/useLayoutManager';
import { useTr } from 'cms-client/view/common/Tr';
import { useDuplicatedItemsZIndex } from 'cms-client/view/article/Item/useDuplicatedItemsZIndex';
import { ItemGeometryContext } from 'cms-client/view/article/ItemGeometry/ItemGeometryContext';
import { useAreaCalculator } from '../useAreaCalculator';
import { useFileUploader } from '../useFileUploader';
import { EditorViewModel } from 'cms-client/domain/editor/features/EditorViewModel';

export function useCopyItems() {
  const Context = useDi(editorContext);
  const vm = useContext(Context);
  const layoutManager = useLayoutManager();
  const { tr } = useTr();
  const itemGeometry = useContext(ItemGeometryContext);
  const sectionGeometry = useContext(SectionGeometryContext);
  const { selectionMode, selectionIds, projectId, layoutId, layouts }
    = useViewModelData(vm, ({ selection, selectionMode, articleRect, layoutId, groupEditingId, projectId, layouts }) =>
      ({
        selectionMode,
        projectId,
        actualWidth: articleRect.width,
        layoutId,
        selectionIds: selection.map(s => s.id),
        groupEditingId,
        layouts
      }), isEqual);
  const filesUploader = useFileUploader();
  const clipboardManager = useMemo(() => new ArticleItemsClipboardManager(projectId!, layouts, filesUploader, vm, tr), [projectId, layouts, filesUploader, vm, tr]);
  const areaCalculator = useAreaCalculator();
  const { getNewItemsZIndexMap, getZIndexesCommands } = useDuplicatedItemsZIndex();
  const pasteCopiedItems = useCallback(async (duplicatedItems: { items: ItemAny[]; fileMap?: Map<string, File>; } | null) => {
    const { layoutId: currentLayout, articleRect } = vm.getData();
    const actualWidth = articleRect.width;
    const articleItems = vm.getItems();
    if (!duplicatedItems || !currentLayout || !articleItems || duplicatedItems.items.length === 0) return;
    const highestZIndex = articleItems.length
      ? Math.max(...articleItems.map(i => layoutManager.getClosestValue(i.area, currentLayout).zIndex))
      : 0;
    const sectionId = sectionGeometry.getClosestSectionByYPos(window.innerHeight / 2);
    if (!sectionId) return;
    const sectionBoundary = sectionGeometry.getBoundary(sectionId);

    const itemIdMap = new Map<string, string>();
    duplicatedItems.items.forEach(item => itemIdMap.set(item.id, ulid()));

    const mappedItems = duplicatedItems.items
      .map(async item => {
        const newId = itemIdMap.get(item.id);
        if (!newId) return null;

        const assetId = await processItemAsset(item, duplicatedItems, vm);

        return {
          ...item,
          id: newId,
          ...(item.type === ArticleItemType.Image && {
            commonParams: {
              ...item.commonParams,
              url: assetId,
            },
            // area: {
            //   ...item.area,
            //   [currentLayout]: {
            //     width: widthCalculation(item, actualWidth),
            //   }
            // }
          }),
          ...(item.type === ArticleItemType.Group && {
            itemsIds: item.itemsIds
              ?.map(id => {
                const mappedId = itemIdMap.get(id);
                if (!mappedId) {
                  console.log(`Missing mapping for id: ${id}`, `itemIdMap: ${itemIdMap}`);
                  return null;
                }
                return mappedId;
              })
              .filter(id => id !== null),
          }),
        };
      });

    const items = (await Promise.all(mappedItems)).filter(item => item !== null);

    const duplicatedItemsBoundaryMap = areaCalculator.getItemsRect(items);
    if (!duplicatedItemsBoundaryMap) return;

    const newItemsLowestZIndex = Math.min(
      ...items.map(i => layoutManager.getClosestValue(i.area, currentLayout).zIndex)
    );

    const newItems: ItemDuplicateData[] = items.map(item => {
      const labels = articleItems
        .filter(i => i.type === item.type && i.label)
        .map(i => i.label ?? i.type);
      const entries = Object.entries(item.area).map(([layoutId, area]) => {
        return [
          layoutId,
          {
            ...area,
            // ...(item.type === ArticleItemType.Group && {
            //   top: (window.innerHeight * 0.5 - sectionBoundary.top) / actualWidth
            //     - item.area[layoutId].height * 0.5,
            //   left: (window.innerWidth * 0.5 - sectionBoundary.left) / actualWidth
            //     - item.area[layoutId].width * 0.5,
            //   zIndex: area.zIndex + highestZIndex - newItemsLowestZIndex + 1,
            // }),
          }
        ];
      });
      const area = Object.fromEntries(entries);
      return {
        ...item,
        area,
        id: item.id,
        sectionId,
        label: getDuplicatedItemLabel(item.label ?? getDefaultItemLabelByType(item.type), labels),
      };
    });

    const newItemsZIndexMap = getNewItemsZIndexMap(newItems);
    const changeArticleZIndexesCommands = getZIndexesCommands(newItems);

    const commands = newItems.map(item => {
      const area = layoutManager.getClosestValue(item.area, currentLayout);
      return {
        type: ArticleCommandTypes.AddItem,
        params: {
          sectionId,
          item: {
            ...item,
            area: {
              ...item.area,
              [currentLayout]: {
                ...area,
                zIndex: newItemsZIndexMap[item.id] ?? area.zIndex
              }
            }
          }
        }
      };
    });
    vm.applyArticleCommand(
      {
        type: ArticleCommandTypes.Batch,
        params: { commands: [...commands, ...changeArticleZIndexesCommands] }
      }
    );
    const groupItem = newItems.find(item => item.type === ArticleItemType.Group);
    const newSelection = groupItem ? [groupItem] : newItems;

    vm.setSelection(newSelection);
  }, [vm, layoutId, sectionGeometry, areaCalculator, layoutManager]);

  const getCopiedItems = useCallback((): ItemAny[] | undefined => {
    const { articleRect, layoutId } = vm.getData();
    if (!layoutId) return [];
    const items = vm.getItems()!;
    const itemsToCopy = items
      .filter(i => selectionIds.includes(i.id))
      .map(i => {
        const sectionId = vm.getItemSectionId(i.id)!;
        const itemRect = itemGeometry.getItemBoundary(i.id);
        const sectionRect = sectionGeometry.getBoundary(sectionId);
        const area = layoutManager.getClosestValue(i.area, layoutId);
        return ({
          ...i,
          sticky: {},
          area: {
            ...i.area,
            [layoutId]: {
              ...area,
              top: (itemRect.top - sectionRect.top) / articleRect.width,
              left: (itemRect.left - sectionRect.left) / articleRect.width
            }
          },
        });
      });
    const groupedItemsIds = itemsToCopy
      .filter((i): i is GroupItem => i.type === ArticleItemType.Group)
      .flatMap(i => i.itemsIds!);
    const groupItems = items.filter(i => groupedItemsIds.includes(i.id));
    return [...itemsToCopy, ...groupItems];
  }, [layoutId, vm, selectionIds]);

  const onPaste = useCallback(async () => {
    const items = await clipboardManager.parseClipboard();
    if (!items) return;
    pasteCopiedItems(items);
  }, [clipboardManager, pasteCopiedItems]);

  const onCopyHotkeyPress = useCallback(() => {
    const items = getCopiedItems();
    if (!items) return;
    clipboardManager.setItemsToClipboard(items);
  }, [clipboardManager, getCopiedItems]);

  useHotkeys('cmd+c, ctrl+c', () => {
    const selection = vm.getData().selection;
    if (selectionMode !== SelectionMode.Compose && selection.length > 0) {
      onCopyHotkeyPress();
    }
  }, { keydown: true }, [selectionMode, onCopyHotkeyPress, vm]);

  useHotkeys('cmd+v, ctrl+v', () => {
    onPaste();
  }, [onPaste]);
}

async function processItemAsset(item: ItemAny, duplicatedItems: { items: ItemAny[]; fileMap?: Map<string, File>; } | null, vm: EditorViewModel) {
  if (!('url' in item.commonParams)) return;
  const imageFile = duplicatedItems?.fileMap?.get(item.id);
  const assetId = imageFile ? await vm.addAsset(imageFile) : 'none';
  if (assetId === 'none') return 'none';

  vm.uploadAsset(assetId);
  return assetId;
}
