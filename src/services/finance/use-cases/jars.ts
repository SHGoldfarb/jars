import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Jar } from '../model';

const table = DB.jars;

export const getJars = async ({ includeArchived = false }: { includeArchived?: boolean } = {}) => {
  const jars = await table.getMap();
  return Object.values(jars)
    .filter((jar) => Jar.safeParse(jar).success)
    .map((jar) => Jar.parse(jar))
    .filter((jar) => includeArchived || !jar.archivedAtISO);
};

export const getJar = async (jarId: string) => {
  return Jar.parse((await table.getMap())[jarId]);
};

export const createJar = ({ name }: { name: string }) => {
  const parsedJar = Jar.parse({ name, id: generateId() });
  return table.upsert(parsedJar);
};

export const updateJar = (jar: Jar) => {
  const parsedJar = Jar.parse(jar);
  return table.upsert(parsedJar);
};

export const archiveJar = async (jarId: string) => {
  const jar = await getJar(jarId);
  jar.archivedAtISO = new Date().toISOString();
  return table.upsert(jar);
};
