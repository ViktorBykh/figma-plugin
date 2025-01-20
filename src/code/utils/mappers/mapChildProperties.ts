import { extractBaseProperties } from '../extractors/extractBaseProperties';
import { mapSpecificProperties } from './mapSpecificProperties';

export async function mapChildProperties(child: SceneNode): Promise<any> {
  return {
    ...await extractBaseProperties(child),
    ...await mapSpecificProperties(child),
  };
}
