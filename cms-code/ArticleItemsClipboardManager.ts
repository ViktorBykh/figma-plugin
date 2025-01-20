/* eslint-disable no-console */
import type { ItemAny, Layout } from '@cntrl-pkg/domain';
import { ItemSchema } from '@cntrl-pkg/domain';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { mapFrameNodesToArticleItems } from './mapper/mapFrameNodesToArticleItems';
import { ArticleFilesUploader } from './ArticleFilesUploader/ArticleFilesUploader';
import { EditorViewModel } from 'cms-client/domain/editor/features/EditorViewModel';

const ClipboardPasteItemsSchema: ZodType<ClipboardData> = z.object({
  projectId: z.string(),
  items: z.array(ItemSchema),
  fileMap: z.map(z.string(), z.instanceof(File)).optional(),
});

interface ClipboardData {
  projectId: string;
  items: ItemAny[];
  fileMap?: Map<string, File>;
}

const CLIPBOARD_TYPE = 'web application/control-items';

export class ArticleItemsClipboardManager {
  constructor(
    private projectId: string,
    private layouts: Layout[] | undefined,
    private filesUploader: ArticleFilesUploader,
    private vm: EditorViewModel,
    private tr: (key: string) => string,
  ) {}

  private async parsePasteEvent(event: ClipboardEvent): Promise<{ items: ItemAny[]; fileMap?: Map<string, File>; } | null> {
    try {
      if (!event.clipboardData) return null;

      const dataFromClipboard = event.clipboardData.getData('text/html');
      const dataToParse = dataFromClipboard.split('<meta charset=\'utf-8\'>')[1];

      if (!dataToParse) return null;

      const parsedData = JSON.parse(dataToParse);
      const dataToMap = parsedData['application/control-items'];

      const mappedItems = mapFrameNodesToArticleItems(dataToMap, this.layouts);

      return mappedItems;
    }
    catch (error) {
      console.error('Error parsing pasted clipboard data:', error);
      return null;
    }
  }

  private async handlePasteEvent(): Promise<{ items: ItemAny[]; fileMap?: Map<string, File>; } | null> {
    return new Promise<{ items: ItemAny[]; fileMap?: Map<string, File>; } | null>((resolve) => {
      document.addEventListener('paste', async (event: ClipboardEvent) => {
        const parsedItems = await this.parsePasteEvent(event);
        resolve(parsedItems);
      });
    });
  }

  async parseClipboard(): Promise<{ items: ItemAny[]; fileMap?: Map<string, File>; } | null> {
    try {
      const mappedItems = await this.handlePasteEvent();
      if (mappedItems) {
        const clipboardData: ClipboardData = {
          projectId: this.projectId,
          items: mappedItems.items,
          fileMap: mappedItems.fileMap,
        };

        console.log('clipboardData', clipboardData);

        const parsedResult = ClipboardPasteItemsSchema.safeParse(clipboardData);

        console.log('parsedResult', parsedResult);

        if (parsedResult.success) {
          return parsedResult.data;
        }
        return null;
      }

      const clipboardItems = await navigator.clipboard.read();
      const item = clipboardItems.find(item => item.types.includes(CLIPBOARD_TYPE));

      if (!item) return null;

      const blob = await item.getType(CLIPBOARD_TYPE);
      const text = await blob.text();
      const json = JSON.parse(text);

      const parsed = ClipboardPasteItemsSchema.safeParse(json);
      if (!parsed.success) return null;

      if (parsed.data.projectId !== this.projectId) {
        alert(this.tr('editor_copy_paste_restriction_message'));
        return null;
      }

      return parsed.data;
    }
    catch (error) {
      console.error('Error parsing clipboard:', error);
      return null;
    }
  }

  async setItemsToClipboard(items: ItemAny[]): Promise<void> {
    console.log('items', items);
    try {
      const clipboardData: ClipboardData = {
        projectId: this.projectId,
        items,
      };
      const json = JSON.stringify(clipboardData);
      const blob = new Blob([json], { type: CLIPBOARD_TYPE });
      const clipboardItem = new ClipboardItem({ [CLIPBOARD_TYPE]: blob });
      await navigator.clipboard.write([clipboardItem]);
    }
    catch (error) {
      console.error('Error setting clipboard:', error);
    }
  }
}
