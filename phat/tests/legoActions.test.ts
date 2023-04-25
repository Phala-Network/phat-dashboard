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
import { ActionOffchainRollup } from '@/typings/ActionOffchainRollup';

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
  let offchainRollupFactory: ActionOffchainRollup.Factory;
  let offchainRollup: ActionOffchainRollup.Contract;
  let cloudWalletFactory: SimpleCloudWallet.Factory;
  let cloudWallet: SimpleCloudWallet.Contract;

  let api: ApiPromise;
  let alice: KeyringPair;
  let certAlice: PhalaSdk.CertificateData;
  const txConf = { gasLimit: "10000000000000", storageDepositLimit: null };
  let currentStack: string;
  let systemContract: string;

  const rpc = process.env.RPC ?? "http://localhost:8545";
  const ethSecretKey = process.env.PRIVKEY ?? "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const lensApi = process.env.LENS ?? "https://api-mumbai.lens.dev/";
  const anchorAddr = process.env.ANCHOR ?? "93891cb936B62806300aC687e12d112813b483C1";

  before(async function () {
    this.timeout(20_000);

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
    offchainRollupFactory = await this.devPhase.getFactory('action_offchain_rollup');
    cloudWalletFactory = await this.devPhase.getFactory('simple_cloud_wallet');

    await qjsFactory.deploy();
    await legoFactory.deploy();
    await evmTransactionFactory.deploy();
    await offchainRollupFactory.deploy();
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

  describe("Run actions", function () {
    this.timeout(500_000_000);

    before(async function () {
      // Deploy contract
      lego = await legoFactory.instantiate("default", [], {});
      evmTransaction = await evmTransactionFactory.instantiate("default", [], {});
      offchainRollup = await offchainRollupFactory.instantiate("default", [], {});
      // STEP 0: now the stake goes to simple_cloud_wallet since it initiates all the call
      cloudWallet = await cloudWalletFactory.instantiate("default", [], { transferToCluster: 1e12 });
      console.log(`Lego deployed to ${lego.address.toHex()}`);
      console.log(`ActionEvm deployed to ${evmTransaction.address.toHex()}`);
      console.log(`ActionOffchainRollup deployed to ${offchainRollup.address.toHex()}`);
      console.log(`CloudWallet deployed to ${cloudWallet.address.toHex()}`);
      await sleep(3_000);
    });

    it("can setup contracts", async function () {
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

      await TxHandler.handle(
        evmTransaction.tx.config({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      await checkUntil(async () => {
        const result = await evmTransaction.query.getRpc(certAlice, {});
        return !result.output.toJSON().ok.err;
      }, 1000 * 10);
      console.log("ActionEvmTransaction configured");

      // STEP 3: link ActionOffchainRollup to CloudWallet
      await TxHandler.handle(
        offchainRollup.tx.config({ gasLimit: "10000000000000" }, cloudWallet.address.toHex()),
        alice,
        true
      );
      await checkUntil(async () => {
        const result = await offchainRollup.query.getAttestAddress(certAlice, {});
        let ready = !result.output.toJSON().ok.err;
        if (ready)
          console.log(`>>>>> ActionOffchainRollup identity: ${JSON.stringify(result.output.toJSON().ok.ok)} <<<<<`);
        return ready;
      }, 1000 * 10);
      console.log("ActionOffchainRollup configured");

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

    it("can run rollup-based Oracle", async function () {
      function cfg(o: object) {
        return JSON.stringify(o);
      }

      // STEP 4: assume user has deployed the smart contract client
      // config ActionOffchainRollup client
      let transform_js = `
        function transform(arg) {
            let input = JSON.parse(arg);
            return input.data.profile.stats.totalCollects;
        }
        transform(scriptArgs[0])
      `;
      await TxHandler.handle(
        offchainRollup.tx.configClient({ gasLimit: "10000000000000" },
          rpc,
          [...Uint8Array.from(Buffer.from(anchorAddr, 'hex'))],
          lensApi,
          transform_js),
        alice,
        true,
      );
      await checkUntil(async () => {
        const result = await offchainRollup.query.getTransformJs(certAlice, {});
        // console.log(`${JSON.stringify(result)}`);
        return !result.output.toJSON().ok.err;
      }, 1000 * 10);
      console.log("ActionOffchainRollup client configured");

      // STEP 5: add the workflow, the WorkflowId increases from 0
      // pub fn answer_request(&self) -> Result<Option<Vec<u8>>>
      // this return EVM tx id
      const selectorAnswerRequest = 0x2a5bcd75
      const actions_lens_api = `[
        {"cmd": "call", "config": ${cfg({ "callee": offchainRollup.address.toHex(), "selector": selectorAnswerRequest, "input": [] })}},
        {"cmd": "log"}
      ]`;
      await TxHandler.handle(
        cloudWallet.tx.addWorkflow({ gasLimit: "10000000000000" }, "TestRollupOracle", actions_lens_api),
        alice,
        true,
      );
      // STEP 6: authorize the workflow to ask for the ETH account signing
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
      // ATTENTION: the oralce is on-demand so it will only respond when there is request from EVM client
      while (true) {
        const result = await cloudWallet.query.poll(certAlice, {});
        console.log(`Workflow trigger: ${JSON.stringify(result)}`);
        // expect(!result.output.toJSON().ok.err).to.be.true;

        sleep(5_000);
      }
    });

    it.skip("can run raw-tx-based Oracle", async function () {
      function cfg(o: object) {
        return JSON.stringify(o);
      }

      function toHexString(o: object) {
        return Buffer.from(JSON.stringify(o)).toString('hex')
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

      const lensApiRequest = {
        url: 'https://api-mumbai.lens.dev/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: toHexString({
          query: `
          query Profile {
            profile(request: { profileId: "0x01" }) {
              stats {
                totalFollowers
                totalFollowing
                totalPosts
                totalComments
                totalMirrors
                totalPublications
                totalCollects
              }
            }
          }
          `,
        }),
        returnTextBody: true,
      };

      const actions_lens_api = `[
        {"cmd": "fetch", "config": ${cfg(lensApiRequest)}},
        {"cmd": "eval", "config": "JSON.parse(input.body).data.profile.stats.totalFollowers"},
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

      // STEP 3: add the workflow
      await TxHandler.handle(
        cloudWallet.tx.addWorkflow({ gasLimit: "10000000000000" }, "TestRawTxOracle", actions_lens_api),
        alice,
        true,
      );
      // STEP 4: authorize the workflow to ask for the ETH account signing
      await TxHandler.handle(
        cloudWallet.tx.authorizeWorkflow({ gasLimit: "10000000000000" }, 1, 0),
        alice,
        true,
      );
      await checkUntil(async () => {
        const resultWorkflow = await cloudWallet.query.getWorkflow(certAlice, {}, 1); // 1 for WorkflowId
        // console.log(`cloudWallet workflow: ${JSON.stringify(resultWorkflow)}`);
        const resultWorkflowCount = await cloudWallet.query.workflowCount(certAlice, {});
        const resultAuthorized = await cloudWallet.query.getAuthorizedAccount(certAlice, {}, 1); // 1 for WorkflowId
        // console.log(`cloudWallet authorize: ${JSON.stringify(resultAuthorized)}`);
        return !resultWorkflow.output.toJSON().ok.err && resultWorkflowCount.output.toJSON().ok === 2
          && resultAuthorized.output.toJSON().ok === 0 // this 0 means the Workflow_0 is authorized to use ExternalAccount_0
      }, 1000 * 10);

      // Trigger the workflow execution, this will be done by our daemon server instead of frontend
      const result = await cloudWallet.query.poll(certAlice, {});
      console.log(`cloudWallet poll: ${JSON.stringify(result)}`);
      expect(!result.output.toJSON().ok.err).to.be.true;
    });
  });
});
