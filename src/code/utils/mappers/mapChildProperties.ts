import { extractBaseProperties } from '../extractors/extractBaseProperties';
import { mapSpecificProperties } from './mapSpecificProperties';

export function mapChildProperties(child: SceneNode): any {
  return {
    ...extractBaseProperties(child),
    ...mapSpecificProperties(child),
  };
}
