import * as PhalaSdk from "@phala/sdk";
import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ContractType,
  ContractFactory,
  RuntimeContext,
  TxHandler,
} from "devphase";
import { Lego } from "@/typings/Lego";
import { PinkSystem } from "@/typings/PinkSystem";

import "dotenv/config";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUntil(async_fn, timeout) {
  const t0 = new Date().getTime();
  while (true) {
    if (await async_fn()) {
      return;
    }
    const t = new Date().getTime();
    if (t - t0 >= timeout) {
      throw new Error("timeout");
    }
    await sleep(100);
  }
}

describe("Run lego actions", () => {
  let legoFactory: Lego.Factory;
  let qjsFactory: ContractFactory;
  let lego: Lego.Contract;
  let systemFactory: PinkSystem.Factory;
  let system: PinkSystem.Contract;

  let api: ApiPromise;
  let alice: KeyringPair;
  let certAlice: PhalaSdk.CertificateData;
  const txConf = { gasLimit: "10000000000000", storageDepositLimit: null };
  let currentStack: string;
  let systemContract: string;

  before(async function () {
    currentStack = (await RuntimeContext.getSingleton()).paths.currentStack;
    console.log("clusterId:", this.devPhase.mainClusterId);
    console.log(`currentStack: ${currentStack}`);

    api = this.api;

    const clusterInfo =
      await api.query.phalaFatContracts.clusters(
        this.devPhase.mainClusterId
      );
    systemContract = clusterInfo.unwrap().systemContract.toString();
    console.log("system contract:", systemContract);

    legoFactory = await this.devPhase.getFactory('lego');
    qjsFactory = await this.devPhase.getFactory('qjs', {
      clusterId: this.devPhase.mainClusterId,
      contractType: "IndeterministicInkCode" as any,
    });
    systemFactory = await this.devPhase.getFactory(`${currentStack}/system.contract`);

    await qjsFactory.deploy();
    await legoFactory.deploy();

    api = this.api;
    alice = this.devPhase.accounts.alice;
    certAlice = await PhalaSdk.signCertificate({
      api,
      pair: alice,
    });

    system = (await systemFactory.attach(systemContract)) as any;
    await TxHandler.handle(
      system.tx["system::setDriver"](
        { gasLimit: "10000000000000" },
        "JsDelegate",
        qjsFactory.metadata.source.hash
      ),
      alice,
      true,
    );

    await checkUntil(async () => {
      const { output } = await system.query["system::getDriver"](
        certAlice,
        {},
        "JsDelegate"
      );
      return !output.isEmpty;
    }, 1000 * 10);
    console.log("Signer:", alice.address.toString());
  });

  describe("Run actions", () => {
    before(async function () {
      this.timeout(30_000);
      // Deploy contract
      lego = await legoFactory.instantiate("default", [], {
        transferToCluster: 1e12,
      });
      await sleep(3_000);
    });

    it("can run actions", async function () {
      const selector = 0x68af3241;
      function cfg(o: object) {
        return JSON.stringify(o);
      }
      const actions_json = `[
            {"cmd": "fetch", "config": ${cfg({
        returnTextBody: true,
        url: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR",
      })}},
            {"cmd": "eval", "config": "BigInt(Math.round(JSON.parse(input.body).USD * 1000000))"},
            {"cmd": "eval", "config": "scale.encode(input, scale.encodeU128)"},
            {"cmd": "log"}
      ]`;
      const result = await lego.query.run(certAlice, {}, actions_json);
      expect(result.result.isOk).to.be.true;
      expect(result.output?.valueOf()).to.be.true;
    });
  });
});
