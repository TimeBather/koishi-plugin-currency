import {Argv, Context, Service, Session} from "koishi";
import {BaseCurrencyManager, Transaction} from "./base";
import {injectSession, revertSession} from "./session";
import {Currencies, addCommandListeners} from "./index";

declare module "koishi" {
  interface Context {
    currency: CurrencyService
  }

  interface Tables {
    transaction: Transaction
  }
}

export interface CurrencyMetaInformation {
  name?: string
  unit?: string
  hidden?: boolean
}

export class CurrencyService extends Service {
  currencies: Map<string, BaseCurrencyManager> = new Map();
  metadata: Map<string, CurrencyMetaInformation> = new Map();
  default_currency = new BaseCurrencyManager(this.ctx.database, "default::this-do-not-exists")

  constructor(ctx: Context) {
    super(ctx, 'currency')
  }

  public readonly using = ['database']

  start() {
    injectSession()
    addCommandListeners(this.ctx);
  }

  stop() {
    revertSession()
  }

  protected __get_base(currencyId: string) {
    if (!this.currencies.has(currencyId))
      this.currencies.set(currencyId, new BaseCurrencyManager(this.ctx.database, currencyId));
    return this.currencies.get(currencyId);
  }

  async add(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.add>) {
    return await this.__get_base(currencyId).add(...args)
  }

  async cost(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.cost>) {
    return await this.__get_base(currencyId).cost(...args)
  }

  async deposit(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.deposit>) {
    return await this.__get_base(currencyId).deposit(...args)
  }

  async revert(...args: Parameters<typeof BaseCurrencyManager.prototype.revert>) {
    return await this.default_currency.revert(...args)
  }

  async get(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.get>) {
    return await this.__get_base(currencyId).get(...args)
  }

  async set(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.set>) {
    return await this.__get_base(currencyId).set(...args)
  }

  async confirm(...args: Parameters<typeof BaseCurrencyManager.prototype.confirm>) {
    return await this.default_currency.confirm(...args)
  }

  async transfer(currencyId: string, ...args: Parameters<typeof BaseCurrencyManager.prototype.transfer>) {
    return await this.__get_base(currencyId).transfer(...args)
  }

  extends(currencyId: keyof Currencies, meta?: CurrencyMetaInformation) {
    this.ctx.database.extend('user', {
        [currencyId]: {
          type: 'double',
          initial: 0
        },
      }
    )
    if (meta && !this.metadata.has(currencyId)) {
      this.metadata.set(currencyId, meta);
    }
  }
}
