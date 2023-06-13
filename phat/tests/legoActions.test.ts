import * as fs from 'fs';
import * as path from 'path';
import * as PhalaSdk from "@phala/sdk";
import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ContractFactory,
  RuntimeContext,
  TxHandler,
  ContractType,
} from "@devphase/service";
import { System } from "@/typings/System";
import { Lego } from "@/typings/Lego";
import { BrickProfileFactory } from "@/typings/BrickProfileFactory"
import { BrickProfile } from '@/typings/BrickProfile';
import { ActionEvmTransaction } from "@/typings/ActionEvmTransaction";
import { ActionOffchainRollup } from '@/typings/ActionOffchainRollup';
import { hex, loadInkAbi, callCfg } from "./utils";

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
  let system: System.Contract;
  let qjsFactory: ContractFactory;
  let legoFactory: Lego.Factory;
  let lego: Lego.Contract;
  let profileFactoryFactory: BrickProfileFactory.Factory;
  let profileFactory: BrickProfileFactory.Contract;
  let brickProfileFactory: BrickProfile.Factory;
  let brickProfile: BrickProfile.Contract;
  let evmTransactionFactory: ActionEvmTransaction.Factory;
  let evmTransaction: ActionEvmTransaction.Contract;
  let offchainRollupFactory: ActionOffchainRollup.Factory;
  let offchainRollup: ActionOffchainRollup.Contract;

  let api: ApiPromise;
  let alice: KeyringPair;
  let certAlice: PhalaSdk.CertificateData;
  let currentStack: string;
  let nextWorkflowId = 0;

  const rpc = process.env.RPC ?? "http://localhost:8545";
  const ethSecretKey = process.env.PRIVKEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const lensApi = process.env.LENS ?? "https://api-mumbai.lens.dev/";
  const anchorAddr = process.env.ANCHOR ?? "0xb037f1EDD1474D028984D6594F7E848CDD3FAdE3";

  before(async function () {
    this.timeout(500_000_000);

    currentStack = this.devPhase.runtimeContext.paths.currentStack;
    system = await this.devPhase.getSystemContract(this.devPhase.mainClusterId) as any;
    console.log("clusterId:", this.devPhase.mainClusterId);
    console.log("system contract:", system.contractId);
    console.log(`currentStack: ${currentStack}`);

    api = this.api;
    const clusterInfo =
      await api.query.phalaPhatContracts.clusters(
        this.devPhase.mainClusterId
      );
    qjsFactory = await this.devPhase.getFactory('qjs', {
      clusterId: this.devPhase.mainClusterId,
      contractType: ContractType.IndeterministicInkCode,
    });
    legoFactory = await this.devPhase.getFactory('lego', { contractType: ContractType.InkCode });
    profileFactoryFactory = await this.devPhase.getFactory('brick_profile_factory', { contractType: ContractType.InkCode });
    brickProfileFactory = await this.devPhase.getFactory('brick_profile', { contractType: ContractType.InkCode });
    evmTransactionFactory = await this.devPhase.getFactory('action_evm_transaction', { contractType: ContractType.InkCode });
    offchainRollupFactory = await this.devPhase.getFactory('action_offchain_rollup', { contractType: ContractType.InkCode });

    await qjsFactory.deploy();
    await legoFactory.deploy();
    await profileFactoryFactory.deploy();
    await brickProfileFactory.deploy();
    await evmTransactionFactory.deploy();
    await offchainRollupFactory.deploy();

    alice = this.devPhase.accounts.alice;
    certAlice = await PhalaSdk.signCertificate({
      api,
      pair: alice,
    });
    console.log("Signer:", alice.address.toString());


    // Upgrade pink runtime to latest, so that we can store larger values to the storage
    await TxHandler.handle(
      system.tx["system::upgradeRuntime"](
        { gasLimit: "10000000000000" },
        [1, 1],
      ),
      alice,
      true,
    );

    // register the qjs to JsDelegate driver
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
      // Deploy contracts
      lego = await legoFactory.instantiate("default", [], {});
      evmTransaction = await evmTransactionFactory.instantiate("default", [], {});
      // setup BrickProfileFactory
      profileFactory = await profileFactoryFactory.instantiate("new", [brickProfileFactory.metadata.source.hash], { transferToCluster: 1e12 });
      {
        const { output } = await profileFactory.query.profileCodeHash(certAlice, {});
        console.log(`BrickProfileFactory uses code ${output.asOk}`);
      }

      // STEP 0: create BrickProfile using BrickProfileFactory
      await TxHandler.handle(
        profileFactory.tx.createUserProfile({ gasLimit: "10000000000000" }), alice, true
      );
      await sleep(1_000);
      await checkUntil(async () => {
        const { output } = await profileFactory.query.getUserProfileAddress(certAlice, {});
        if (output.asOk.isOk) {
          let profileAddress = output.asOk.asOk.toHex();
          brickProfile = await brickProfileFactory.attach(profileAddress);
          console.log(`BrickProfile deployed to ${profileAddress}`);
          // const result = await brickProfile.query.owner(certAlice, {});
          // console.log(`Profile owner: ${JSON.stringify(result.output)}`);
          return true;
        }
        return false;
      }, 1000 * 10);

      // connect ActionOffchainRollup to BrickProfile
      offchainRollup = await offchainRollupFactory.instantiate("new", [brickProfile.address], {});
      {
        const { output: profileAddress } = await offchainRollup.query.getBrickProfileAddress(certAlice, {});
        console.log(`ActionOffchainRollup connects to BrickProfile ${profileAddress.asOk.toHex()}`);
        const { output: rollupIdentity } = await offchainRollup.query.getAttestAddress(certAlice, {});
        console.log(`>>>>> ActionOffchainRollup identity: ${rollupIdentity.asOk} <<<<<`);
      }

      console.log(`Lego deployed to ${lego.address.toHex()}`);
      console.log(`BrickProfileFactory deployed to ${profileFactory.address.toHex()}`);
      console.log(`ActionEvmTransaction deployed to ${evmTransaction.address.toHex()}`);
      console.log(`ActionOffchainRollup deployed to ${offchainRollup.address.toHex()}`);
    });

    it("can setup contracts", async function () {
      // STEP 1: config BrickProfile to the lego contract address
      await TxHandler.handle(
        brickProfile.tx.config({ gasLimit: "10000000000000" }, lego.address.toHex()),
        alice,
        true,
      );
      console.log("BrickProfile configured");

      // STEP 2: generate the external ETH account, the ExternalAccountId increases from 0
      // importEvmAccount is only available for debug, will be disabled in first release
      // await TxHandler.handle(
      //   brickProfile.tx.importEvmAccount({ gasLimit: "10000000000000" }, rpc, ethSecretKey),
      //   alice,
      //   true,
      // );
      await TxHandler.handle(
        brickProfile.tx.generateEvmAccount({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      await TxHandler.handle(
        brickProfile.tx.generateEvmAccount({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      console.log("Two BrickProfile accounts generated");

      await TxHandler.handle(
        evmTransaction.tx.config({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output } = await evmTransaction.query.getRpc(certAlice, {});
        return output.asOk.isOk;
      }, 1000 * 10);
      console.log("ActionEvmTransaction configured");

      await checkUntil(async () => {
        const { output: outputJsRunner } = await brickProfile.query.getJsRunner(certAlice, {});
        const { output: outputAccountCount } = await brickProfile.query.externalAccountCount(certAlice, {});
        const { output: outputAccount } = await brickProfile.query.getEvmAccountAddress(certAlice, {}, 0); // 0 for ExternalAccountId
        return outputAccountCount.asOk.toPrimitive() === 2
          && outputJsRunner.asOk.isOk && outputAccount.asOk.isOk;
      }, 1000 * 10);
    });

    it("can update rpc endpoint", async function () {
      await TxHandler.handle(
        brickProfile.tx.generateEvmAccount({ gasLimit: "10000000000000" }, rpc),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output: outputAccountCount } = await brickProfile.query.externalAccountCount(certAlice, {});
        return outputAccountCount.asOk.toPrimitive() === 3;
      }, 1000 * 10);

      let mockRpc = "https://mock-rpc.com";
      await TxHandler.handle(
        brickProfile.tx.setRpcEndpoint({ gasLimit: "10000000000000" }, 2, mockRpc),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output } = await brickProfile.query.getRpcEndpoint(certAlice, {}, 2);
        return output.asOk.asOk.toString() === mockRpc;
      }, 1000 * 10);
    });

    it("can dump secret key", async function () {
      {
        const { output } = await brickProfile.query.getDumpedKey(certAlice, {}, 2);
        expect(output.asOk.isErr).to.be.true;
      };
      await TxHandler.handle(
        brickProfile.tx.dumpEvmAccount({ gasLimit: "10000000000000" }, 2),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output } = await brickProfile.query.getDumpedKey(certAlice, {}, 2);
        return output.asOk.isOk;
      }, 1000 * 10);
    });

    it("can run rollup-based Oracle", async function () {
      function cfg(o: object) {
        return JSON.stringify(o);
      }

      // STEP 3: assume user has deployed the smart contract client
      // config ActionOffchainRollup client
      await TxHandler.handle(
        offchainRollup.tx.configClient({ gasLimit: "10000000000000" }, rpc, anchorAddr),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output } = await offchainRollup.query.getClient(certAlice, {});
        // console.log(`ActionOffchainRollup client ${JSON.stringify(output)}`);
        return output.asOk.isOk;
      }, 1000 * 10);
      console.log("ActionOffchainRollup client configured");

      let coreJs = fs.readFileSync("./example-oracles/lens_stats/dist/index.js", "utf8");
      await TxHandler.handle(
        offchainRollup.tx.configCore({ gasLimit: "10000000000000" }, coreJs, lensApi as any),
        alice,
        true,
      );
      await checkUntil(async () => {
        const { output } = await offchainRollup.query.getCore(certAlice, {});
        console.log(`ActionOffchainRollup handler ${JSON.stringify(output)}`);
        return !output.toJSON().ok;
      }, 1000 * 10);
      console.log("ActionOffchainRollup handler configured");

      // STEP 4: add the workflow, the WorkflowId increases from 0
      // pub fn answer_request(&self) -> Result<Option<Vec<u8>>>
      // this return EVM tx id
      const inkAbi = await loadInkAbi({
        contracts: [
          "./artifacts/action_offchain_rollup/action_offchain_rollup.contract",
        ],
        exports: [
          "answer_request",
        ],
      });
      console.log(`inkAbi:\n${JSON.stringify(inkAbi)}`);

      const workflow = JSON.stringify({
        version: 1,
        debug: true,
        types: inkAbi.typeRegistry,
        actions: [
          {
            cmd: "call",
            config: callCfg(
              offchainRollup.address.toHex(),
              inkAbi.contracts.action_offchain_rollup.answer_request
            )
          },
          {cmd: "log"},
        ],
      });

      const workflowId = nextWorkflowId++;

      await TxHandler.handle(
        brickProfile.tx.addWorkflow({ gasLimit: "10000000000000" }, "TestRollupOracle", workflow),
        alice,
        true,
      );
      // STEP 5: authorize the workflow to ask for the ETH account signing
      await TxHandler.handle(
        brickProfile.tx.authorizeWorkflow({ gasLimit: "10000000000000" }, workflowId, 0),
        alice,
        true,
      );
      await checkUntil(async () => {
        const resultWorkflow = await brickProfile.query.getWorkflow(certAlice, {}, workflowId);
        // console.log(`brickProfile workflow: ${JSON.stringify(resultWorkflow)}`);
        const resultWorkflowCount = await brickProfile.query.workflowCount(certAlice, {});
        const resultAuthorized = await brickProfile.query.getAuthorizedAccount(certAlice, {}, workflowId); // 0 for WorkflowId
        // console.log(`brickProfile authorize: ${JSON.stringify(resultAuthorized)}`);
        return !resultWorkflow.output.toJSON().ok.err && resultWorkflowCount.output.toJSON().ok === workflowId + 1
          && resultAuthorized.output.toJSON().ok === 0 // this 0 means the Workflow_0 is authorized to use ExternalAccount_0
      }, 1000 * 10);

      // Trigger the workflow execution, this will be done by our daemon server instead of frontend
      // ATTENTION: the oralce is on-demand so it will only respond when there is request from EVM client
      while (true) {
        let { output: outputWorkflowCount } = await brickProfile.query.workflowCount(certAlice, {});
        for (let i = 0; i < outputWorkflowCount.asOk; i++) {
          const { output } = await brickProfile.query.poll(certAlice, {}, i);
          console.log(`Workflow ${i} triggerred: ${JSON.stringify(output)}`);
        }

        await sleep(5_000);
      }
    });

    it.skip("can run raw-tx-based Oracle", async function () {
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
      // then call brick_profile to sign it
      const calleeWallet = brickProfile.address.toHex();
      // pub fn sign_evm_transaction(&self, tx: Vec<u8>) -> Result<Vec<u8>>
      const selectorSignEvmTransaction = 0xad848771;

      // build EVM transaction to call `onPhatRollupReceived(address from, bytes calldata price)`
      let abi_file = fs.readFileSync(path.join(__dirname, '../res/receiver.abi.json'));
      const arg_to = '0xabd257f376acab89e077650bfcb4ff89081a9ec1';
      const arg_abi = hex(abi_file);
      const arg_function = 'onPhatRollupReceived';
      // 20-byte `address from`, in this case we don't care about this
      const arg_param_0 = hex(Array(20).fill(0));
      // 32 byte `bytes calldata price`, this should be consturcted from the output of last step

      console.log("loading ink abi...");
      const inkAbi = await loadInkAbi({
        contracts: [
          "./artifacts/action_evm_transaction/action_evm_transaction.json",
          "./artifacts/brick_profile/brick_profile.json",
        ],
        exports: [
          "build_transaction",
          "sign_evm_transaction",
          "maybe_send_transaction",
        ],
      });
      console.log(`abi:\n${JSON.stringify(inkAbi)}`);

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

      const workflow = JSON.stringify({
        version: 1,
        debug: true,
        types: inkAbi.typeRegistry,
        actions: [
          { cmd: "fetch", config: lensApiRequest },
          {
            cmd: "eval",
            config:
              "numToUint8Array32(JSON.parse(input.body).data.profile.stats.totalFollowers)",
          },
          {
            cmd: "eval",
            config: `['${arg_to}', '${arg_abi}', '${arg_function}', ['${arg_param_0}', input]]`,
          },
          {
            cmd: "call",
            config: callCfg(
              calleeEvmTransaction,
              inkAbi.contracts.action_evm_transaction.build_transaction
            ),
          },
          { cmd: "eval", config: "[input.Ok.Ok]" },
          {
            cmd: "call",
            config: callCfg(
              calleeWallet,
              inkAbi.contracts.brick_profile.sign_evm_transaction
            ),
          },
          { cmd: "eval", config: "[input.Ok.Ok]" },
          {
            cmd: "call",
            config: callCfg(
              calleeEvmTransaction,
              inkAbi.contracts.action_evm_transaction.maybe_send_transaction
            ),
          },
          { cmd: "log" },
        ],
      });

      console.log(`workflow:\n${workflow}`);

      const workflowId = nextWorkflowId++;
      // STEP 3: add the workflow
      await TxHandler.handle(
        brickProfile.tx.addWorkflow({ gasLimit: "10000000000000" }, "TestRawTxOracle", workflow),
        alice,
        true,
      );
      // STEP 4: authorize the workflow to ask for the ETH account signing
      await TxHandler.handle(
        brickProfile.tx.authorizeWorkflow({ gasLimit: "10000000000000" }, workflowId, 0),
        alice,
        true,
      );
      await checkUntil(async () => {
        const resultWorkflow = await brickProfile.query.getWorkflow(certAlice, {}, workflowId); // 1 for WorkflowId
        // console.log(`brickProfile workflow: ${JSON.stringify(resultWorkflow)}`);
        const resultWorkflowCount = await brickProfile.query.workflowCount(certAlice, {});
        const resultAuthorized = await brickProfile.query.getAuthorizedAccount(certAlice, {}, workflowId); // 1 for WorkflowId
        // console.log(`brickProfile authorize: ${JSON.stringify(resultAuthorized)}`);
        return !resultWorkflow.output.toJSON().ok.err && resultWorkflowCount.output.toJSON().ok === workflowId + 1
          && resultAuthorized.output.toJSON().ok === 0 // this 0 means the Workflow_0 is authorized to use ExternalAccount_0
      }, 1000 * 10);

      // Trigger the workflow execution, this will be done by our daemon server instead of frontend
      const result = await brickProfile.query.poll(certAlice, {}, 0);
      console.log(`brickProfile poll: ${JSON.stringify(result)}`);
      expect(!result.output.toJSON().ok.err).to.be.true;
    });
  });
});
