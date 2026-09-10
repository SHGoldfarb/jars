// Rejecting a file is an expected outcome, not an exception, so the failure travels in the
// return type and the caller cannot forget to handle it.
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

// The same shape for a command that either ran or explained why it did not.
export type CommandResult = { ok: true } | { ok: false; error: string };
