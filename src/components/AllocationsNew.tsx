import { useNavigate } from '@tanstack/react-router';
import { financeCommands, AllocationUnsaved } from 'src/services/finance';
import { AllocationForm } from './AllocationForm';

export const AllocationsNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (value: AllocationUnsaved) => {
    await financeCommands.allocations.create(value);
    await navigate({ to: '/movements' });
  };

  return (
    <AllocationForm
      title="Create Allocation"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error creating allocation"
    />
  );
};
