import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance/application';
import { useParams } from '@tanstack/react-router';
import { useJar } from 'src/hooks/useJar';
import { GenericNameForm } from './GenericNameForm';
import { useJarBalance } from 'src/hooks/useJarBalance';
import { decimal } from 'src/lib/decimal';

export const JarsEdit = () => {
  const { jarId } = useParams({ strict: false });
  const jar = useJar(jarId ?? '');
  const balance = useJarBalance(jarId ?? '');
  const navigate = useNavigate();

  if (!jar || !balance) {
    return null;
  }

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.jars.rename({ jarId: jar.id, name });
      await navigate({ to: '/jars' });
    } catch (error) {
      console.error('Failed to update jar:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await financeCommands.jars.archive({ jarId: jar.id });
      await navigate({ to: '/jars' });
    } catch (error) {
      console.error('Failed to delete jar:', error);
    }
  };

  return (
    <GenericNameForm
      title="Edit Jar"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/jars"
      initialName={jar.name}
      onDelete={() => {
        void handleDelete();
      }}
      fieldName="jarName"
      placeholder="Beach Trip"
      disableDeleteButton={decimal.toNumber(balance.amountDecimal) !== 0}
    />
  );
};
