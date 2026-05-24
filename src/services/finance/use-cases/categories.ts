import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Category, CategoryExpense, CategoryIncome } from '../model';

const table = DB.categories;

export const getCategories = async ({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) => {
  const categories = await table.getMap();
  return Object.values(categories)
    .filter((category) => Category.safeParse(category).success)
    .map((category) => Category.parse(category))
    .filter((category) => includeArchived || !category.archivedAtISO);
};

export const getCategory = async (categoryId: string) => {
  return Category.parse((await table.getMap())[categoryId]);
};

export const updateCategory = async (category: Category) => {
  const parsedCategory = Category.parse(category);
  return table.upsert(parsedCategory);
};

export const createCategory = async ({
  name,
  kind,
}: {
  name: string;
  kind: 'income' | 'expense';
}) => {
  const parsedCategory = Category.parse({ name, kind, id: generateId() });
  return table.upsert(parsedCategory);
};

export const archiveCategory = async (categoryId: string) => {
  const category = await getCategory(categoryId);
  category.archivedAtISO = new Date().toISOString();
  return table.upsert(category);
};

export const getCategoriesIncome = async (params: Parameters<typeof getCategories>[0] = {}) => {
  const categories = await getCategories(params);
  return categories
    .filter((category) => category.kind === 'income')
    .map((category) => CategoryIncome.parse(category));
};

export const getCategoriesExpense = async (params: Parameters<typeof getCategories>[0] = {}) => {
  const categories = await getCategories(params);
  return categories
    .filter((category) => category.kind === 'expense')
    .map((category) => CategoryExpense.parse(category));
};

export const createCategoryIncome = async ({ name }: { name: string }) => {
  const parsedCategory = CategoryIncome.parse({ name, kind: 'income', id: generateId() });
  return await table.upsert(parsedCategory);
};

export const createCategoryExpense = async ({ name }: { name: string }) => {
  const parsedCategory = CategoryExpense.parse({ name, kind: 'expense', id: generateId() });
  return await table.upsert(parsedCategory);
};
