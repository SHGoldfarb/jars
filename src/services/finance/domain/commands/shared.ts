import type { Archivable } from '../../model';

export const ensureActive = (entity: Archivable, entityName: string): void => {
  if (entity.archivedAtISO) {
    throw new Error(`${entityName} is archived`);
  }
};
