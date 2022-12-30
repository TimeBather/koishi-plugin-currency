import {EconomicError} from "./types";
import {Argv, Context} from "koishi";
import {Transaction} from "./base";

declare module "koishi" {
  namespace Command {
    interface Config {
      cost?: number
      currency?: string
      revertOnFail?: boolean
    }
  }

  interface Argv {
    transaction?: Transaction
  }
}

export function addCommandListeners(ctx: Context) {
  ctx.on("command-error", async function (c, e) {
    if (e instanceof EconomicError) {
      switch (e.error_type) {
        case 'insufficient_balance':
          await c.session.send("余额不足。")
          return;
      }
      return;
    }
    if ((c.command.config.revertOnFail == null || c.command.config.revertOnFail == true) && c.transaction) {
      c.session.revert(c.transaction);
    }
  })
  ctx.on("command/before-execute", async function (argv: Argv) {
    try {
      if (argv.command.config.currency && argv.command.config.cost > 0)
        argv.transaction = await argv.session.cost(argv.command.config.currency, argv.command.config.cost, "使用命令：" + argv.command.name);

    } catch (e) {
      if (e instanceof EconomicError) {
        switch (e.error_type) {
          case 'insufficient_balance':
            return '余额不足!';
        }
      }
    }
  });
}
