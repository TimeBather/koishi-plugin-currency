import {Context, Schema, segment, Service} from 'koishi'
import {EconomicService} from "./service";

export const name = 'economic'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const using = ['database']

export interface Currencies{

}

declare module 'koishi' {
  interface User extends Currencies{}
}

export function apply(ctx: Context) {
  ctx.database.extend('transaction',{
    id: 'integer',
    fromUserId: 'integer',
    toUserId: 'integer',
    currencyId: 'string',
    amount: 'double',
    reason: 'string',
    status: 'integer'
  },{
    autoInc:true
  })
  ctx.plugin(EconomicService)
}

export * from './service'
export * from './base'
export * from './session'
export * from './types'
export * from './command'
