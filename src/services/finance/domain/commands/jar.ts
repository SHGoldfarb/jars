import * as z from 'zod';
import { Jar } from '../../model';
import { ensureActive } from './shared';

const NewJarInput = z.object({
  id: Jar.shape.id,
  name: Jar.shape.name,
});

type NewJarInput = z.infer<typeof NewJarInput>;

const RenameJarInput = z.object({
  name: Jar.shape.name,
});

type RenameJarInput = z.infer<typeof RenameJarInput>;

export const jars = {
  create: (input: NewJarInput) => Jar.parse(input),
  rename: (jar: Jar, input: RenameJarInput) => {
    ensureActive(jar, 'Jar');
    return Jar.parse({ ...jar, ...RenameJarInput.parse(input) });
  },
  restore: (jar: Jar) => Jar.parse({ ...jar, archivedAtISO: undefined }),
  archive: (jar: Jar, archivedAtISO = new Date().toISOString()) =>
    Jar.parse({ ...jar, archivedAtISO }),
};
