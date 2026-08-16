import * as z from 'zod';

const getFirstErrorMessage = (errors: unknown[] | undefined): string | undefined => {
  if (!errors?.length) {
    return undefined;
  }

  const firstError = errors[0];

  if (typeof firstError === 'string') {
    return firstError;
  }

  if (firstError && typeof firstError === 'object' && 'message' in firstError) {
    const message = firstError.message;
    return typeof message === 'string' ? message : undefined;
  }

  throw new Error(
    `Unexpected error type: ${typeof errors[0]} ${JSON.stringify(errors[0], null, 2)}`
  );
};

const validateWithSchema = <T extends object>(
  value: T,
  schema: z.ZodType<T>
): { fields: Partial<Record<keyof T, string>> } | undefined => {
  const result = schema.safeParse(value);

  if (result.success) {
    return undefined;
  }

  const fields: Partial<Record<keyof T, string>> = {};

  for (const issue of result.error.issues) {
    const [path] = issue.path;
    if (typeof path !== 'string') {
      continue;
    }

    if (!(path in fields) && issue.message) {
      fields[path as keyof T] = issue.message;
    }
  }

  return {
    fields,
  };
};

export const formUtils = {
  getFirstErrorMessage,
  validateWithSchema,
};
