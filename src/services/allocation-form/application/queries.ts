import { financeQueries } from 'src/services/finance';

const createAllocationFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  return {
    // Gets the options that should be shown in the allocation form jar selectors:
    // The non archived jars + the origin/destination jars of the allocation being edited,
    // even if they are archived.
    getJarsForSelector: async (allocationId: string | undefined) => {
      const jars = await financeQueriesDeps.jars.list();
      if (allocationId) {
        const allocation = await financeQueriesDeps.allocations.getById(allocationId);
        const jarIds = jars.map(({ id }) => id);
        const missingIds = [allocation.originJarId, allocation.destinationJarId].filter(
          (id) => !jarIds.includes(id)
        );
        if (missingIds.length > 0) {
          const missingJars = await Promise.all(
            missingIds.map((id) => financeQueriesDeps.jars.getById(id))
          );
          return [...missingJars, ...jars];
        }
      }
      return jars;
    },
  };
};

export const allocationFormQueries = createAllocationFormQueries(financeQueries);
