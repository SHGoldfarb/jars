import * as z from 'zod';
import { Archivable, Identifiable, Nameable, ensureActive } from './shared';

export const Jar = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
});

export type Jar = z.infer<typeof Jar>;

const NewJarInput = z.object({
  id: Identifiable.shape.id,
  name: Nameable.shape.name,
});

type NewJarInput = z.infer<typeof NewJarInput>;

const RenameJarInput = z.object({
  name: Nameable.shape.name,
});

type RenameJarInput = z.infer<typeof RenameJarInput>;

export const createJar = (input: NewJarInput) => Jar.parse(input);

export const renameJar = (jar: Jar, input: RenameJarInput) => {
  ensureActive(jar, 'Jar');
  return Jar.parse({ ...jar, ...RenameJarInput.parse(input) });
};

export const restoreJar = (jar: Jar) => Jar.parse({ ...jar, archivedAtISO: undefined });

export const archiveJar = (jar: Jar, archivedAtISO = new Date().toISOString()) =>
  Jar.parse({ ...jar, archivedAtISO });
