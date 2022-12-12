// Unit tests using mocha and chai for the economic service
import {Context} from "koishi";
import {expect} from 'chai';
import MemoryDatabase from '@koishijs/plugin-database-memory';
//@ts-ignore
import {BaseCurrencyManager, Transaction} from "../src";

declare module "koishi" {
  interface User {
    test: number
  }

}
describe('BaseCurrencyManager', function () {
  let app: Context = null
  beforeEach(async function () {
    app = new Context()
    await app.start()
    app.plugin(MemoryDatabase)
    await new Promise((resolve) => app.using(['database'], resolve))
    app.database.extend('user',{
      test: 'double',
    })
    app.database.extend('transaction',{
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
    await app.database.create('user',{
      id: 1,
      test: 0
    })
  });

  function createManager() {
    return new BaseCurrencyManager(app.database, "test");
  }

  it("Should be able to create a new currency", async function () {
    createManager();
  })

  it("Should be able to add money to a user", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(100)
  });

  it("Should be able to create a add transaction with correct value", async function () {
    const currency = createManager();
    const transaction = await currency.add(1,100,"test")
    expect(transaction.fromUserId).to.equal(-1)
    expect(transaction.toUserId).to.equal(1)
    expect(transaction.currencyId).to.equal("test")
    expect(transaction.amount).to.equal(100)
    expect(transaction.reason).to.equal("add:test")
    expect(transaction.status).to.equal(0)
  });

  it("Should be able to cost money from a user", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.cost(1,50,"test")
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(50)
    expect((await app.database.get("transaction",{fromUserId:1})).length).be.equal(1)
    expect((await app.database.get("transaction",{toUserId:1})).length).be.equal(1)
  });

  it("Should throw an error when cost money if the user doesn't have enough money", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    try{
      await currency.cost(1,150,"test")
      expect.fail("The function did not throw a error")
    }catch (e){
      expect(e.message).to.equal("Insufficient balance")
    }
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(100)
    expect((await app.database.get("transaction",{fromUserId:1})).length).be.equal(0)
  });

  it("Should be able to deposit money from a user", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.deposit(1,50,"test")
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(50)
    const transaction = await app.database.get("transaction",{fromUserId:1})
    expect(transaction.length).to.equal(1)
  })


  it("Should throw an error when deposit money if the user doesn't have enough money", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    try{
      await currency.deposit(1,150,"test")
      expect.fail("The function did not throw a error")
    }catch (e){
      expect(e.message).to.equal("Insufficient balance")
    }
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(100)
    expect((await app.database.get("transaction",{fromUserId:1})).length).be.equal(0)
  });



  it("Should be able to revert a transaction", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.cost(1,50,"test")
    const transaction = await app.database.get("transaction",{fromUserId:1})
    expect(transaction.length).to.equal(1)
    await currency.revert(transaction[0].id)
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(100)
    //Check the transaction status
    const transaction_reverted = await app.database.get("transaction",{fromUserId:1})
    expect(transaction_reverted[0].status).to.equal(2)
  });

  it("Should be able to confirm a transaction",async function(){
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.deposit(1,50,"test")
    const transaction = await app.database.get("transaction",{fromUserId:1})
    expect(transaction.length).to.equal(1)
    await currency.confirm(transaction[0].id)
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(50)
    //Check the transaction status
    const transaction_reverted = await app.database.get("transaction",{fromUserId:1})
    expect(transaction_reverted[0].status).to.equal(0)
  })

  it("Should throw a error when revert a transaction that doesn't exist", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.cost(1,50,"test")
    try{
      await currency.revert(9999)
      expect.fail("The function did not throw a error")
    }catch (e){
      expect(e.message).to.equal("Invalid transaction")
    }
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(50)
  });

  it("Should throw a error when revert a transaction that has been reverted", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.cost(1,50,"test")
    const transaction = await app.database.get("transaction",{fromUserId:1})
    expect(transaction.length).to.equal(1)
    await currency.revert(transaction[0].id)
    try{
      await currency.revert(transaction[0].id)
      expect.fail("The function did not throw a error")
    }catch (e){
      expect(e.message).to.equal("Transaction has already reverted")
    }
    const user = await app.database.get("user",{id:1})
    expect(user[0].test).to.equal(100)
  });

  it("Should able transfer money from a user to another user", async function () {
    await app.database.create('user',{
      id: 2,
      test: 0
    })
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.transfer(1,2,50,"test")
    const user1 = await app.database.get("user",{id:1})
    const user2 = await app.database.get("user",{id:2})
    expect(user1[0].test).to.equal(50)
    expect(user2[0].test).to.equal(50)
  })

  it("Should throw a error when transfer money if the user doesn't have enough money", async function () {
    await app.database.create('user',{
      id: 2,
      test: 0
    })
    const currency = createManager();
    await currency.add(1,100,"test")
    try{
      await currency.transfer(1,2,150,"test")
    }catch (e){
      expect(e.message).to.equal("Insufficient balance")
    }
    const user1 = await app.database.get("user",{id:1})
    const user2 = await app.database.get("user",{id:2})
    expect(user1[0].test).to.equal(100)
    expect(user2[0].test).to.equal(0)
  });

  it("Should able revert a transfer transaction", async function () {
    await app.database.create('user',{
      id: 2,
      test: 0
    })
    const currency = createManager();
    await currency.add(1,100,"test")
    await currency.transfer(1,2,50,"test")
    const transaction = await app.database.get("transaction",{fromUserId:1})
    await currency.revert(transaction[0].id)
    const user1 = await app.database.get("user",{id:1})
    const user2 = await app.database.get("user",{id:2})
    expect(user1[0].test).to.equal(100)
    expect(user2[0].test).to.equal(0)
  });


  it("Should able to get the balance of a user", async function () {
    const currency = createManager();
    await currency.add(1,100,"test")
    const balance = await currency.get(1)
    expect(balance).to.equal(100)
  });

  it("Should able to set the balance", async function () {
    const currency = createManager();
    await currency.set(1,100,"test")
    const balance = await currency.get(1)
    expect(balance).to.equal(100)
  })

  afterEach(async function () {
    await app.stop()
  })
});
