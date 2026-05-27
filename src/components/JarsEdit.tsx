import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance/application';
import { useParams } from '@tanstack/react-router';
import { useJar } from 'src/hooks/useJar';
import { GenericNameForm } from './GenericNameForm';

export const JarsEdit = () => {
  const { jarId } = useParams({ strict: false });
  const jar = useJar(jarId ?? '');
  const navigate = useNavigate();

  if (!jar) {
    return null;
  }

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.renameJar({ jarId: jar.id, name });
      await navigate({ to: '/jars' });
    } catch (error) {
      console.error('Failed to update jar:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await financeCommands.archiveJar({ jarId: jar.id });
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
    />
  );
};
