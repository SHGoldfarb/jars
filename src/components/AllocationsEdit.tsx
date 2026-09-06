import { useNavigate } from '@tanstack/react-router';
import { financeCommands, AllocationUnsaved } from 'src/services/finance';
import { allocationForm } from 'src/services/allocation-form';
import { useAllocationEditCurrentAllocation } from 'src/hooks/useAllocationEditCurrentAllocation';
import { AllocationForm } from './AllocationForm';

export const AllocationsEdit = () => {
  const allocation = useAllocationEditCurrentAllocation();
  const navigate = useNavigate();

  if (!allocation) {
    return null;
  }

  const handleSubmit = async (value: AllocationUnsaved) => {
    await financeCommands.allocations.update({ ...allocation, ...value });
    await navigate({ to: '/movements' });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.allocations.archive({ allocationId: allocation.id });
      await navigate({ to: '/movements' });
    } catch (error) {
      console.error('Failed to delete allocation:', error);
    }
  };

  return (
    <AllocationForm
      title="Edit Allocation"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error editing allocation"
      defaultValues={allocationForm.toFormValues(allocation)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
