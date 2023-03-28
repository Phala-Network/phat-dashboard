import * as fs from 'fs';
import * as path from 'path';
import * as PhalaSdk from "@phala/sdk";
import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ContractFactory,
  RuntimeContext,
  TxHandler,
} from "devphase";
import { PinkSystem } from "@/typings/PinkSystem";
import { Lego } from "@/typings/Lego";
import { ActionEvmTransaction } from "@/typings/ActionEvmTransaction";
import { SimpleCloudWallet } from '@/typings/SimpleCloudWallet';

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
  let systemFactory: PinkSystem.Factory;
  let system: PinkSystem.Contract;
  let qjsFactory: ContractFactory;
  let legoFactory: Lego.Factory;
  let lego: Lego.Contract;
  let evmTransactionFactory: ActionEvmTransaction.Factory;
  let evmTransaction: ActionEvmTransaction.Contract;
  let cloudWalletFactory: SimpleCloudWallet.Factory;
  let cloudWallet: SimpleCloudWallet.Contract;

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

    systemFactory = await this.devPhase.getFactory(`${currentStack}/system.contract`);
    qjsFactory = await this.devPhase.getFactory('qjs', {
      clusterId: this.devPhase.mainClusterId,
      contractType: "IndeterministicInkCode" as any,
    });
    legoFactory = await this.devPhase.getFactory('lego');
    evmTransactionFactory = await this.devPhase.getFactory('action_evm_transaction');
    cloudWalletFactory = await this.devPhase.getFactory('simple_cloud_wallet');

    await qjsFactory.deploy();
    await legoFactory.deploy();
    await evmTransactionFactory.deploy();
    await cloudWalletFactory.deploy();

    alice = this.devPhase.accounts.alice;
    certAlice = await PhalaSdk.signCertificate({
      api,
      pair: alice,
    });
    console.log("Signer:", alice.address.toString());

    // register the qjs to JsDelegate driver
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
  });

  describe("Run actions", () => {
    before(async function () {
      this.timeout(30_000);
      // Deploy contract
      lego = await legoFactory.instantiate("default", [], {});
      evmTransaction = await evmTransactionFactory.instantiate("default", [], {});
      // STEP 0: now the stake goes to simple_cloud_wallet since it initiates all the call
      cloudWallet = await cloudWalletFactory.instantiate("default", [], { transferToCluster: 1e12 });
      console.log(`Lego deployed to ${lego.address.toHex()}`);
      console.log(`ActionEvm deployed to ${evmTransaction.address.toHex()}`);
      console.log(`CloudWallet deployed to ${cloudWallet.address.toHex()}`);
      await sleep(3_000);
    });

    it("can setup contracts", async function () {
      const rpc = process.env.RPC;
      const ethSecretKey = process.env.PRIVKEY;

      // config action_evm_transaction
      await TxHandler.handle(
        evmTransaction.tx.config({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      await checkUntil(async () => {
        const result = await evmTransaction.query.getRpc(certAlice, {});
        return !result.output.toJSON().ok.err;
      }, 1000 * 10);
      console.log("ActionEvm configured");

      // STEP 1: config simple_cloud_wallet to the lego contract address
      await TxHandler.handle(
        cloudWallet.tx.config({ gasLimit: "10000000000000" }, lego.address.toHex()),
        alice,
        true,
      );
      console.log("CloudWallet configured");

      // STEP 2: generate the external ETH account, the ExternalAccountId increases from 0
      // importEvmAccount is only available for debug, will be disabled in first release
      await TxHandler.handle(
        cloudWallet.tx.importEvmAccount({ gasLimit: "10000000000000" }, rpc, [...Uint8Array.from(Buffer.from(ethSecretKey, 'hex'))]),
        alice,
        true,
      );
      // await TxHandler.handle(
      //   cloudWallet.tx.generateEvmAccount({ gasLimit: "10000000000000" }, rpc),
      //   alice,
      //   true,
      // );
      console.log("CloudWallet account imported");

      await checkUntil(async () => {
        const resultJsRunner = await cloudWallet.query.getJsRunner(certAlice, {});
        // console.log(`cloudWallet js_runner: ${JSON.stringify(resultJsRunner)}`);
        const resultAccountCount = await cloudWallet.query.externalAccountCount(certAlice, {});
        const resultAccount = await cloudWallet.query.getEvmAccountAddress(certAlice, {}, 0); // 0 for ExternalAccountId
        // console.log(`cloudWallet account_0: ${JSON.stringify(resultAccount)}`);
        return !resultJsRunner.output.toJSON().ok.err
          && !resultAccount.output.toJSON().ok.err && resultAccountCount.output.toJSON().ok === 1;
      }, 1000 * 10);
    });

    it("can run actions", async function () {
      function cfg(o: object) {
        return JSON.stringify(o);
      }

      // call action_evm_transaction to build EVM tx
      const calleeEvmTransaction = evmTransaction.address.toHex();
      // pub fn build_transaction(
      //   &self,
      //   to: String,
      //   abi: Vec<u8>,
      //   func: String,
      //   params: Vec<Vec<u8>>,
      // ) -> Result<Vec<u8>>
      const selectorBuildTransaction = 0x8a688c06;
      // pub fn maybe_send_transaction(&self, rlp: Vec<u8>) -> Result<H256>
      const selectorMaybeSendTransaction = 0x072cd15a;
      // then call simple_cloud_wallet to sign it
      const calleeWallet = cloudWallet.address.toHex();
      // pub fn sign_evm_transaction(&self, tx: Vec<u8>) -> Result<Vec<u8>>
      const selectorSignEvmTransaction = 0xad848771;

      // build EVM transaction to call `onPhatRollupReceived(address from, bytes calldata price)`
      let abi_file = fs.readFileSync(path.join(__dirname, '../res/receiver.abi.json'));
      const arg_to = '0xabd257f376acab89e077650bfcb4ff89081a9ec1';
      const arg_abi = [...abi_file];
      const arg_function = 'onPhatRollupReceived';
      // 20-byte `address from`, in this case we don't care about this
      const arg_param_0 = Array(20).fill(0);
      // 32 byte `bytes calldata price`, this should be consturcted from the output of last step

      const actions_json = `[
        {"cmd": "fetch", "config": ${cfg({
          returnTextBody: true,
          url: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR",
        })}},
        {"cmd": "eval", "config": "Math.round(JSON.parse(input.body).USD)"},
        {"cmd": "eval", "config": "numToUint8Array32(input)"},
        {"cmd": "eval", "config": "scale.encode(['${arg_to}', [${arg_abi}], '${arg_function}', [[${arg_param_0}], input]], scale.encodeBuildTx)"},
        {"cmd": "call", "config": ${cfg({ "callee": calleeEvmTransaction, "selector": selectorBuildTransaction })}},
        {"cmd": "eval", "config": "scale.decode(input, scale.decodeResultVecU8)"},
        {"cmd": "eval", "config": "scale.encode(input.content, scale.encodeVecU8)"},
        {"cmd": "call", "config": ${cfg({ "callee": calleeWallet, "selector": selectorSignEvmTransaction })}},
        {"cmd": "eval", "config": "scale.decode(input, scale.decodeResultVecU8)"},
        {"cmd": "eval", "config": "scale.encode(input.content, scale.encodeVecU8)"},
        {"cmd": "call", "config": ${cfg({ "callee": calleeEvmTransaction, "selector": selectorMaybeSendTransaction })}},
        {"cmd": "log"}
      ]`;

      // STEP 3: add the workflow, the WorkflowId increases from 0
      await TxHandler.handle(
        cloudWallet.tx.addWorkflow({ gasLimit: "10000000000000" }, "TestWorkflow", actions_json),
        alice,
        true,
      );
      // STEP 4: authorize the workflow to ask for the ETH account signing
      await TxHandler.handle(
        cloudWallet.tx.authorizeWorkflow({ gasLimit: "10000000000000" }, 0, 0),
        alice,
        true,
      );
      await checkUntil(async () => {
        const resultWorkflow = await cloudWallet.query.getWorkflow(certAlice, {}, 0); // 0 for WorkflowId
        // console.log(`cloudWallet workflow: ${JSON.stringify(resultWorkflow)}`);
        const resultWorkflowCount = await cloudWallet.query.workflowCount(certAlice, {});
        const resultAuthorized = await cloudWallet.query.getAuthorizedAccount(certAlice, {}, 0); // 0 for WorkflowId
        // console.log(`cloudWallet authorize: ${JSON.stringify(resultAuthorized)}`);
        return !resultWorkflow.output.toJSON().ok.err && resultWorkflowCount.output.toJSON().ok === 1
          && resultAuthorized.output.toJSON().ok === 0 // this 0 means the Workflow_0 is authorized to use ExternalAccount_0
      }, 1000 * 10);

      // Trigger the workflow execution, this will be done by our daemon server instead of frontend
      const result = await cloudWallet.query.poll(certAlice, {});
      console.log(`cloudWallet poll: ${JSON.stringify(result)}`);
      expect(!result.output.toJSON().ok.err).to.be.true;
    });
  });
});
