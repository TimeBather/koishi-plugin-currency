// Unit tests using mocha and chai for the economic service
import {Context} from "koishi";
import {expect} from 'chai';
import MockPlugin from "@koishijs/plugin-mock";
import MemoryDatabase from '@koishijs/plugin-database-memory';
//@ts-ignore
import * as EconomicPlugin from "../src";

declare module "../src"{
  interface Currencies{
    test: number
  }
}

describe('Economic Session API', function () {
  let app: Context = null
  beforeEach(async function () {
    app = new Context()
    await app.start()
    app.plugin(MemoryDatabase)
    app.plugin(EconomicPlugin)
    app.plugin(MockPlugin)
    await new Promise((resolve) => app.using(['database', 'currency','mock'], resolve))
    app.currency.extends("test")
    await app.database.create("user", {id: 1,mock:"1"})
    await app.database.create("user", {id: 2,mock:"2"})
  });
  it("Should be able to deposit money to a user", async function () {
    app.command("test",{authority:0})
      .action(async ({session})=>{
      await session.add("test",10,"Chat")
      await session.cost("test",2000,"Chat!")
      return 'Failed'
    })
    const client = app.mock.client("1","2")
    expect((await client.receive("test"))[0]).to.equal('余额不足。')
  });
});
