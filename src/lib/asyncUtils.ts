/**
 * A wrapper around setTimeout which returns a promise. Useful for waiting for an amount of
 * time from an async function. e.g. await waitFor(1000);
 *
 * @param milliseconds The amount of time to wait.
 * @returns A promise that resolves once the given number of milliseconds has ellapsed.
 */
export const waitFor = (milliseconds: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const emptyPromise = () => {
  let resolve = () => {
    // Blank on purpose
  };

  const promise = new Promise<void>((resolve_) => {
    resolve = resolve_;
  });

  return { promise, resolve };
};

const createLocksStore = () => {
  // This keeps track of existing locks
  const locksByName: Record<string, Promise<void>> = {};

  const get = (name: string) => {
    // If there are no previous locks for this lock name, just use a promise that will resolve immediately
    // as the previous lock.
    if (!(name in locksByName)) {
      locksByName[name] = waitFor(0);
    }

    return locksByName[name];
  };

  const set = (name: string, lock: Promise<void>) => {
    locksByName[name] = lock;
  };

  return { get, set };
};

const locks = createLocksStore();

const createLockIdsTracker = () => {
  let lockId = 0;
  return () => {
    lockId += 1;
    return `__LOCK_ID_${lockId.toString()}`;
  };
};

const newLockId = createLockIdsTracker();

export const createLock = (name?: string) => {
  const lockName = name ?? newLockId();

  const acquire = async () => {
    // Create the lock, which is simply a promise. Obtain the promise's resolve method which
    // we can use to "unlock" the lock, which signals to the next task in line that it can start.
    const { resolve: unlock, promise: newLock } = emptyPromise();

    // Replace the previous lock with our own in the store.
    const prevLock = locks.get(lockName);
    locks.set(lockName, newLock);

    // Wait for our turn
    await prevLock;

    return unlock;
  };

  const around = async <T>(task: () => T): Promise<T> => {
    const release = await acquire();

    // Now that it's our turn, execute the task. We use a finally block here to ensure that we unlock
    // the lock so the next task can start, even if our task throws an error.
    try {
      return await task();
    } finally {
      release();
    }
  };

  return { acquire, around };
};

/**
 * Used to ensure that only a single task for the given lock name can be executed at once.
 * While JS is generally single threaded, this method can be useful when running asynchronous
 * tasks which may interact with external systems (HTTP API calls, React Native plugins, etc)
 * which will cause the main JS thread's event loop to become unblocked. By using the same
 * lock name for a group of tasks you can ensure the only one task will ever be in progress
 * at a given time.
 *
 * @param lockName The name of the lock to be obtained.
 * @param task The task to execute.
 * @returns The value returned by the task.
 */
export const doWithLock = async <T>(lockName: string, task: () => Promise<T>): Promise<T> => {
  const lock = createLock(lockName);

  return await lock.around(task);
};

export const withNamedLock = <T extends unknown[], U>(lockName: string, f: (...params: T) => U) => {
  const lock = createLock(lockName);

  return async (...params: T) => {
    return await lock.around(() => f(...params));
  };
};

export const withLock = <T extends unknown[], U>(f: (...params: T) => U) =>
  withNamedLock(newLockId(), f);
