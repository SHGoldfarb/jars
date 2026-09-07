# Tech Debt

Known engineering debt, roughly in priority order. Unlike `product/epics.md`, nothing here is
user-facing.

<!--
Example item. Keep when the list empties out, so the next entry follows the same shape:

- [ ] **Imperative title naming the fix** — what is wrong, and why it is debt rather than a bug.
      May name the files or commands for a reader to check. Keep the list roughly in priority order.
      Don't go into much detail: this is about the max size.
-->

- [ ] **Collapse the transfer and allocation form stacks** — `TransferForm*`/`AllocationForm*`,
      `useTransferForm*`/`useAllocationForm*` and `services/transfer-form`/`services/allocation-form`
      differ only in the endpoint entity (account vs jar). A generic two-endpoint movement form
      would remove ~15 files.
