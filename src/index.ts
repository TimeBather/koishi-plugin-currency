import {Context, Schema} from 'koishi'
import {CurrencyMetaInformation, CurrencyService} from "./service";

export const name = 'currency'

interface CurrencyPreDeclarations{
  id:string
  meta:CurrencyMetaInformation
}

export interface Config {
  currencies:CurrencyPreDeclarations[]
}

export const Config: Schema<Config> = Schema.object({
  currencies: Schema.array(Schema.object({
    id: Schema.string().description('货币的ID(如money)'),
    meta: Schema.object({
      name: Schema.string().description("货币名称(如金币)"),
      unit: Schema.string().description("货币单位(如个)"),
      hidden: Schema.boolean().description("是否隐藏货币")
    })
  }))
})

export const using = ['database']

export interface Currencies{

}

declare module 'koishi' {
  interface User extends Currencies{}
}

export function apply(ctx: Context,config:Config) {
  ctx.database.extend('transaction', {
    id: 'integer',
    fromUserId: 'integer',
    toUserId: 'integer',
    currencyId: 'string',
    amount: 'double',
    reason: 'string',
    status: 'integer'
  }, {
    autoInc: true
  })
  ctx.plugin(CurrencyService)
  ctx.using(['currency'], (ctx) => {
    config.currencies.map((value) => {
      ctx.currency.extends(value.id as keyof Currencies, value.meta)
    })
  })
}

export * from './service'
export * from './base'
export * from './session'
export * from './types'
export * from './command'
