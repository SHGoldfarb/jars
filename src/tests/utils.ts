let currentId = 0;

const generateIntId = () => {
  currentId++;
  return currentId;
};

const generateId = () => {
  return generateIntId().toString();
};

export const testUtils = {
  generateId,
  generateIntId,
};
