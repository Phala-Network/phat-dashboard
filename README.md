# Phat Bricks Version of Oracle

## Toolchain Version

```bash
cargo contract --version
# cargo-contract-contract 2.0.1-unknown-x86_64-unknown-linux-gnu
```

## Run with

```bash
cd phat
yarn devphase contract compile # this will fail, refer to the known issue
yarn devphase contract test
```

## Known Issues

- The devphase 0.1.14 is not compatible with ink! 4 artifacts (`metadata.json` -> `${contractName}.json`), so you will need to manually compile and copy the artifacts;
