import * as z from 'zod';
import { dateInput } from 'src/lib/dateInput';
import { currencyInput } from 'src/services/shared';

interface AllocationFormValues {
  amount: string;
  date: string;
  description: string;
  originJarId: string;
  destinationJarId: string;
}

const getDefaultValues = (): AllocationFormValues => ({
  amount: '',
  date: dateInput.todayDateInputValue(),
  description: '',
  originJarId: '',
  destinationJarId: '',
});

const allocationValidators = {
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
  description: z.string(),
  originJarId: z.string().trim().min(1, 'Origin jar is required'),
  destinationJarId: z.string().trim().min(1, 'Destination jar is required'),
};

const createFormSchema = (activeJarIds: string[]) =>
  z.object(allocationValidators).superRefine((values, ctx) => {
    if (values.originJarId && !activeJarIds.includes(values.originJarId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['originJarId'],
        message: 'Origin jar must be active',
      });
    }

    if (values.destinationJarId && !activeJarIds.includes(values.destinationJarId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationJarId'],
        message: 'Destination jar must be active',
      });
    }

    if (
      values.originJarId &&
      values.destinationJarId &&
      values.originJarId === values.destinationJarId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationJarId'],
        message: 'Origin and destination jars must be different',
      });
    }
  });

export const allocationFormSchema = {
  getDefaultValues,
  createFormSchema,
};

export type { AllocationFormValues };
