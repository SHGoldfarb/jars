import { MovementFormDomainCommands } from '../domain/commands';
import type { MovementKind, MovementLike } from './kinds';

export const createMovementFormCommands = <TMovement extends MovementLike, TUnsaved>(
  kind: MovementKind<TMovement, TUnsaved>
) => ({
  // The kind already exposes the finance ports the domain command needs, so it doubles as
  // its dependencies; the domain's own `Dependencies` type fixes what it may reach for.
  submitEdit: async (movement: TMovement) => {
    await MovementFormDomainCommands.submitEditMovement(movement, kind);
  },
});
