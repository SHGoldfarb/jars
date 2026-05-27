import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance/application';
import { GenericNameForm } from './GenericNameForm';

export const JarsNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.createJar({ name: name });
      await navigate({ to: '/jars' });
    } catch (error) {
      console.error('Failed to create jar:', error);
    }
  };
  return (
    <GenericNameForm
      title="Create Jar"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute="/jars"
      fieldName="jarName"
      placeholder="Beach Trip"
    />
  );
};
