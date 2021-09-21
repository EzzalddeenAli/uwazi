import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusValueSchema, ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

export function normalizeThesaurusLabel(label?: string | null): string | null {
  if (label === undefined || label === null) {
    return null;
  }
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[] | null> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const thesauriValues = currentThesauri.values || [];

  if (normalizeThesaurusLabel(entityToImport[ensure<string>(property.name)]) === '') {
    return null;
  }

  const thesauriMatching = (v: ThesaurusValueSchema) =>
    normalizeThesaurusLabel(v.label) ===
    normalizeThesaurusLabel(entityToImport[ensure<string>(property.name)]);

  const value = thesauriValues.find(thesauriMatching);

  if (value?.id) {
    return [{ value: value.id, label: value.label }];
  }

  return null;
};

export default select;
