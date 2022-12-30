import {Session} from "koishi";
import {Transaction} from "./base";
import {EconomicMultiEntityOperation, EconomicSingleEntityOperation, EconomicTransactionOperation} from "./types";

interface SessionCurrencyOperations {
  add: EconomicSingleEntityOperation
  cost: EconomicSingleEntityOperation
  deposit: EconomicSingleEntityOperation
  revert: EconomicTransactionOperation
  confirm: EconomicTransactionOperation
  transfer: EconomicMultiEntityOperation
  getBalance: (currencyId: string) => number
  setBalance: (currencyId: string, amount: number, reason: string) => Transaction
}

type PromisifyAll<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K]
}
declare module "koishi" {
  interface Session extends PromisifyAll<SessionCurrencyOperations> {
  }
}

export function injectSession() {
  async function execute<T extends keyof SessionCurrencyOperations>(_this: Session, name: T, ...args: Parameters<SessionCurrencyOperations[T]>): Promise<ReturnType<SessionCurrencyOperations[T]>> {
    if (!_this['app']) throw new Error("No app service found.");
    if (!_this.app['database']) throw new Error("No database service found")
    await _this.observeUser(["id"])
    if (!_this.user || !(typeof _this.user['id'] == 'number')) throw new Error("Cannot get user information from session , use ctx.economic API instead.")
    args.splice(1, 0, _this.user['id'])
    return await (_this.app.currency[name as string])(...args)
  }

  Session.prototype.add = function (this: Session, ...args) {
    return execute(this, 'add', ...args)
  }
  Session.prototype.cost = function (this: Session, ...args) {
    return execute(this, 'cost', ...args)
  }
  Session.prototype.deposit = function (this: Session, ...args) {
    return execute(this, 'deposit', ...args)
  }
  Session.prototype.transfer = function (this: Session, ...args) {
    return execute(this, 'transfer', ...args)
  }
  Session.prototype.getBalance = function (this: Session, ...args) {
    if (!this['app']) throw new Error("No app service found.");
    if (!this.app['database']) throw new Error("No database service found")
    if (!this.user || !(typeof this.user['id'] == 'number')) throw new Error("Cannot get user information from session , use ctx.economic API instead.")
    return this.app.currency.get(...args, this.user['id'])
  }
  Session.prototype.setBalance = function (this: Session, currencyId: string, amount: number, reason: string) {
    if (!this['app']) throw new Error("No app service found.");
    if (!this.app['database']) throw new Error("No database service found")
    if (!this.user || !(typeof this.user['id'] == 'number')) throw new Error("Cannot get user information from session , use ctx.economic API instead.")
    return this.app.currency.set(currencyId, this.user['id'], amount, reason)
  }
}

export function revertSession() {
  Session.prototype.add = Session.prototype.cost
    = Session.prototype.deposit
    = Session.prototype.transfer
    = Session.prototype.transfer
    = Session.prototype.getBalance
    = Session.prototype.setBalance = undefined;
}
