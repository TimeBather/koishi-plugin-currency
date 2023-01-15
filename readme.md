# koishi-plugin-currency

[![npm](https://img.shields.io/npm/v/koishi-plugin-currency?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-currency)

A currency plugin for koishi framework

## This plugin is still under development! The API and the service signature may change in the future.

# 简单样例 Example
```typescript
import {} from 'koishi-plugin-economic'
//....
export function apply(ctx:Context){
    ctx.currency.extends('money')
    ctx.command('any-command',{
      cost:30,          // 花费的数量
      currency:'money', // 指定货币类型
      revertOnFail:true // 这里默认就是true
    })
      .action(()=>{
          return '花费了30块!'
      })
  ctx.command('recharge')
    .alias('充值')
    .action(({session})=>{
      session.add('money',100,'说明一下增加/减少余额原因,比如recharge')
      return '充值成功!'
    })
  ctx.currency.add('money',anyUserId,100,'说明一下增加/减少余额原因,比如recharge')
}
```

# API Documentation
## Currency API
### 交易API
#### currency.extends(name:string)
  向系统声明一个父货币类型(也就是从插件无需进行声明)
#### currency.add(name:string,userId:number,amount:number,reason:string)
  增加用户拥有的某种货币数量
#### currency.cost(name:string,userId:number,amount:number,reason:string)
  消耗用户拥有的某种货币数量
#### currency.get(name:string,userId:number)
  获取用户拥有的某种货币数量
#### currency.set(name:string,userId:number,amount:number,reason:string)
  设置用户拥有的某种货币数量
#### currency.deposit(name:string,userId:number,amount:number,reason:string)
  抵押用户拥有的某种货币数量
#### currency.transfer(name:string,fromUserId:number,toUserId:number,amount:number,reason:string)
  转移用户拥有的某种货币数量
### 交易操作API
#### currency.confirm(transaction:Transaction|number)
  确认之前的抵押交易，可以传入Transaction或者number(Transaction.ID)
#### currency.revert(transaction:Transaction|number)
  撤销之前的交易（包括抵押交易和普通交易），可以传入Transaction或者number(Transaction.ID)
## Session API
### 交易API
#### session.add(name:string,amount:number,reason:string)
  增加Session对应用户拥有的某种货币数量
#### session.cost(name:string,amount:number,reason:string)
  消耗Session对应用户拥有的某种货币数量
#### session.getBalance(name:string)
  获取Session对应用户拥有的某种货币数量
#### session.setBalance(name:string,amount:number,reason:string)
  设置Session对应用户拥有的某种货币数量
#### session.deposit(name:string,amount:number,reason:string)
  抵押Session对应用户拥有的某种货币数量
#### session.transfer(name:string,toUserId:number,amount:number,reason:string)
  转移Session对应用户拥有的某种货币数量

