import {Database, User} from "koishi";
import {InsufficientBalanceError} from "./types";
export interface Transaction{
  id: number
  fromUserId: number
  toUserId: number
  currencyId: string
  amount: number
  reason: string
  status: number // 0 : success 1:pending 2:reverted
}

export class BaseCurrencyManager{

  constructor(private database : Database , private currencyId: string){}

  protected async checkBalanceForUser(userId: number, amount: number){
    const user = await this.database.get("user",{id:userId})
    if(user.length<=0)throw new Error('Invalid from user')
    if(user[0][this.currencyId]<amount){
      throw new InsufficientBalanceError()
    }
  }

  protected async createTransaction(fromUserId: number, toUserId: number, amount: number, reason: string,status: number = 0): Promise<Transaction>{
    return await this.database.create("transaction",{
      fromUserId,
      toUserId,
      currencyId:this.currencyId,
      amount,
      reason,
      status
    });
  }

  protected async executeRawTransaction(fromUserId: number, toUserId: number, amount: number, reason: string,status: number = 0){
    if(fromUserId!=-1) {
      await this.checkBalanceForUser(fromUserId,amount);
      await this.database.set("user", {id: fromUserId}, {[this.currencyId]: {$add: [{$: this.currencyId}, -amount]}});
    }
    if(toUserId!=-1)
      await this.database.set("user",{id:toUserId},{[this.currencyId]:{$add:[{$:this.currencyId},amount]}});
    try{
      return await this.createTransaction(fromUserId,toUserId,amount,reason,status);
    }catch (e){
      if(fromUserId!=-1)
        await this.database.set("user",{id:fromUserId},{[this.currencyId]:{$add:[{$:this.currencyId},amount]}});
      if(toUserId!=-1)
        await this.database.set("user",{id:toUserId},{[this.currencyId]:{$add:[{$:this.currencyId},-amount]}});
      throw e;
    }
  }

  async add(userId: number, amount: number, reason: string): Promise<Transaction>{
    return await this.executeRawTransaction(-1,userId,amount,'add:'+reason);
  }

  async cost(userId: number, amount: number, reason: string): Promise<Transaction>{
    return await this.executeRawTransaction(userId,-1,amount,'cost:'+reason);
  }

  async deposit(userId: number, amount: number, reason: string): Promise<Transaction>{
    return await this.executeRawTransaction(userId,-1,amount,'deposit:'+reason,1);
  }

  async transfer(fromUserId: number, toUserId: number, amount: number, reason: string): Promise<Transaction>{
    return await this.executeRawTransaction(fromUserId,toUserId,amount,'transfer:'+reason);
  }

  async revert(_transaction: Transaction | number): Promise<void>{
    let transaction: Transaction;
    if(typeof _transaction === "number"){
      const transactions = await this.database.get("transaction",{id:_transaction})
      if(transactions.length<=0)throw new Error('Invalid transaction')
      transaction = transactions[0] as Transaction;
    }else{
      transaction = _transaction
    }
    if(transaction.status == 2)throw new Error('Transaction has already reverted')
    if(transaction.fromUserId!=-1)
      await this.database.set("user",{id:transaction.fromUserId},{[transaction.currencyId]:{$add:[{$:transaction.currencyId},transaction.amount]}});
    if(transaction.toUserId!=-1)
      await this.database.set("user",{id:transaction.toUserId},{[transaction.currencyId]:{$add:[{$:transaction.currencyId},-transaction.amount]}});

    try{
      await this.database.set("transaction",{id:transaction.id},{status:2})
   }catch (e){
      if(transaction.fromUserId!=-1)
        await this.database.set("user",{id:transaction.fromUserId},{[this.currencyId]:{$add:[{$:this.currencyId},-transaction.amount]}});
      if(transaction.toUserId!=-1)
        await this.database.set("user",{id:transaction.toUserId},{[this.currencyId]:{$add:[{$:this.currencyId},transaction.amount]}});
      throw e;
    }
  }

  async confirm(transaction: Transaction | number): Promise<void>{
    let _transaction: Transaction;
    const transactions = await this.database.get("transaction",{id:typeof transaction=='number'?transaction:transaction.id})
    if(transactions.length<=0)throw new Error('Invalid transaction')
    _transaction = transactions[0] as Transaction;
    if(_transaction.status == 2)throw new Error('Transaction already reverted')
    else if(_transaction.status == 0)throw new Error('Transaction already confirmed')
    await this.database.set("transaction",{id:_transaction.id},{status:0})
  }

  async get(userId: number): Promise<number>{
    const user = await this.database.get("user",{id:userId})
    if(user.length<=0)throw new Error('Invalid user')
    return user[0][this.currencyId];
  }

  async set(userId: number, amount: number, reason: string): Promise<Transaction>{
    const user = await this.database.get("user",{id:userId})
    if(user.length<=0)throw new Error('Invalid user')
    const oldAmount = user[0][this.currencyId];
    await this.database.set("user",{id:userId},{[this.currencyId]:amount});
    try{
      return await this.createTransaction(-1,userId,amount-oldAmount,"set:"+reason);
    }catch (e){
      await this.database.set("user",{id:userId},{[this.currencyId]:oldAmount});
      throw e;
    }
  }

}
