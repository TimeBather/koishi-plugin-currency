import {Transaction} from "./base";

export type EconomicSingleEntityOperation = (currencyId: string, amount: number, reason: string) => Transaction

export type EconomicMultiEntityOperation = (currencyId: string, toUserId: number, amount: number, reason: string) => Transaction

export type EconomicTransactionOperation = (transaction: Transaction) => void

export abstract class EconomicError extends Error {
  readonly abstract error_type
}

export class InsufficientBalanceError extends EconomicError {
  readonly error_type = 'insufficient_balance'

  constructor() {
    super('Insufficient balance')
  }
}
