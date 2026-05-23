import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Jar } from '../model';

const table = DB.jars;

export const getJars = async ({ includeArchived = false }: { includeArchived?: boolean } = {}) => {
  const jars = await table.toArray();
  return jars
    .filter((jar) => Jar.safeParse(jar).success)
    .map((jar) => Jar.parse(jar))
    .filter((jar) => includeArchived || !jar.archivedAtISO);
};

export const createJar = async ({ name }: { name: string }) => {
  const parsedJar = Jar.parse({ name, id: generateId() });
  return await table.add(parsedJar);
};

export const updateJar = async (jar: Jar) => {
  const parsedJar = Jar.parse(jar);
  return await table.put(parsedJar);
};

export const archiveJar = async (jarId: string) => {
  const jar = Jar.parse(await table.get(jarId));
  jar.archivedAtISO = new Date().toISOString();
  return await table.put(jar);
};

export const getJar = async (jarId: string) => {
  return Jar.parse(await table.get(jarId));
};
