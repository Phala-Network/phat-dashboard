# Phat Bricks Version of Oracle

## Toolchain Version

```bash
cargo contract --version
# cargo-contract-contract 2.0.1-unknown-x86_64-unknown-linux-gnu
```

## Test

Prepare your EVM RPC and account, this repo use Polygon Mumbai testnet as an example.

  const rpc = process.env.RPC ?? "http://localhost:8545";
  const ethSecretKey = process.env.PRIVKEY ?? "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const lensApi = process.env.LENS ?? "https://api-mumbai.lens.dev/";
  const anchorAddr = process.env.ANCHOR ?? "93891cb936B62806300aC687e12d112813b483C1";

```bash
# EVM rpc
export RPC=https://polygon-mumbai.g.alchemy.com/v2/<your-api-key>
# Account private key, without the "0x" prefix
export PRIVKEY=<you-polygon-account-privkey>
# Optional: data source of Lens api Oracle
export LENS=https://api-mumbai.lens.dev/
# The smart contract to receive the Oracle data, without the "0x" prefix
export ANCHOR=<you-client-smart-contract-address>
```

then run the test with

```bash
cd phat

# Optional
yarn devphase contract compile

yarn devphase contract test
```
This will call the `function _onMessageReceived(bytes calldata action)` in the pre-deployed smart contract mentioned in [evm/README.md](../evm/README.md).

## Code Details

The core logic is to build a workflow in [phat/tests/legoActions.test.ts](./tests/legoActions.test.ts).

Finally, you should see the workflow execution logs in `./logs/<your_test_time>/pruntime.log` like
```log
[2023-03-13T12:10:23.912398Z INFO  pink] [5DxDTttM7JKtQRjFQn2CoTnbr5YSUL3jeK8d4yEetJPtd4dx] evaluating js, code len: 12616
[2023-03-13T12:10:24.463494Z INFO  pink] [5DxDTttM7JKtQRjFQn2CoTnbr5YSUL3jeK8d4yEetJPtd4dx] JS: Actions: [
            {"cmd": "fetch", "config": {"returnTextBody":true,"url":"https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR"}},
            {"cmd": "eval", "config": "Math.round(JSON.parse(input.body).USD)"},
            {"cmd": "eval", "config": "numToUint8Array32(input)"},
            {"cmd": "eval", "config": "scale.encode(['0xabd257f376acab89e077650bfcb4ff89081a9ec1', [91,123,34,105,110,112,117,116,115,34,58,91,123,34,105,110,116,101,114,110,97,108,84,121,112,101,34,58,34,97,100,100,114,101,115,115,34,44,34,110,97,109,101,34,58,34,95,102,114,111,109,34,44,34,116,121,112,101,34,58,34,97,100,100,114,101,115,115,34,125,44,123,34,105,110,116,101,114,110,97,108,84,121,112,101,34,58,34,98,121,116,101,115,34,44,34,110,97,109,101,34,58,34,95,97,99,116,105,111,110,34,44,34,116,121,112,101,34,58,34,98,121,116,101,115,34,125,93,44,34,110,97,109,101,34,58,34,111,110,80,104,97,116,82,111,108,108,117,112,82,101,99,101,105,118,101,100,34,44,34,111,117,116,112,117,116,115,34,58,91,123,34,105,110,116,101,114,110,97,108,84,121,112,101,34,58,34,98,121,116,101,115,52,34,44,34,110,97,109,101,34,58,34,34,44,34,116,121,112,101,34,58,34,98,121,116,101,115,52,34,125,93,44,34,115,116,97,116,101,77,117,116,97,98,105,108,105,116,121,34,58,34,110,111,110,112,97,121,97,98,108,101,34,44,34,116,121,112,101,34,58,34,102,117,110,99,116,105,111,110,34,125,93,10], 'onPhatRollupReceived', [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], input]], scale.encodeBuildTx)"},
            {"cmd": "call", "config": {"callee":"0xd39dcfb5d8792d4602771ed75569d9ea36d8e5cc948c9beeda7c8a58a5156043","selector":2322107398}},
            {"cmd": "eval", "config": "scale.decode(input, scale.decodeResultVecU8)"},
            {"cmd": "eval", "config": "scale.encode(input.content.content, scale.encodeVecU8)"},
            {"cmd": "call", "config": {"callee":"0x5d9bf569b0215c53b24d133e78a58aa453c66635c13317285f6ea6e99358e5c5","selector":2911143793}},
            {"cmd": "eval", "config": "scale.decode(input, scale.decodeResultVecU8)"},
            {"cmd": "eval", "config": "scale.encode(input.content.content, scale.encodeVecU8)"},
            {"cmd": "call", "config": {"callee":"0xd39dcfb5d8792d4602771ed75569d9ea36d8e5cc948c9beeda7c8a58a5156043","selector":120377690}},
            {"cmd": "log"}
          ]
...
[2023-03-13T12:10:29.892755Z INFO  pink] [5DxDTttM7JKtQRjFQn2CoTnbr5YSUL3jeK8d4yEetJPtd4dx] JS: running action [log], log(input=0,0,223,78,174,43,185,9,46,218,186,30,63,192,229,247,187,96,98,83,152,86,16,194,168,2,247,104,10,43,209,200,195,84)
[2023-03-13T12:10:29.917332Z INFO  pink] [5DxDTttM7JKtQRjFQn2CoTnbr5YSUL3jeK8d4yEetJPtd4dx] eval result: Ok(String("undefined"))
```
