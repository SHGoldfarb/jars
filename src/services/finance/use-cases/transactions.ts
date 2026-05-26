import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Transaction, TransactionUnsaved } from '../model';

const table = DB.transactions;

export const getTransactions = async ({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) => {
  const transactions = await table.getMap();
  return Object.values(transactions)
    .filter((transaction) => Transaction.safeParse(transaction).success)
    .map((transaction) => Transaction.parse(transaction))
    .filter((transaction) => includeArchived || !transaction.archivedAtISO);
};

export const createTransaction = async (transaction: TransactionUnsaved) => {
  const parsedTransaction = Transaction.parse({ ...transaction, id: generateId() });
  return table.upsert(parsedTransaction);
};

export const updateTransaction = async (transaction: Transaction) => {
  const parsedTransaction = Transaction.parse(transaction);
  return table.upsert(parsedTransaction);
};

export const getTransaction = async (transactionId: string) => {
  return Transaction.parse((await table.getMap())[transactionId]);
};

export const archiveTransaction = async (transactionId: string) => {
  const transaction = await getTransaction(transactionId);
  transaction.archivedAtISO = new Date().toISOString();
  return table.upsert(transaction);
};
