import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensPubOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0x94Af64b38E27acD8b0B01dBCF214536D4a357A3c'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Setting attestor ...');
  await oracle.connect(deployer).setAttestor("0xa4d81361579ff03e085457bb38cbc6f481eada0e"); // change this to the identity of your ActionOffchainRollup
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
