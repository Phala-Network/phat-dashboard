import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env['MUMBAI_API'],
      accounts: [process.env['MUMBAI_SK']!],
      chainId: 80001,
    }
  },
  etherscan: {
    apiKey: process.env['POLYGONSCAN_MUMBAI_API_KEY'],
  },
};

export default config;
