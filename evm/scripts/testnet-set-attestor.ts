import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0x93891cb936B62806300aC687e12d112813b483C1'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Setting attestor ...');
  await oracle.connect(deployer).setAttestor("0xe141c8cb929c5322b4529a4ae9e4673a3c6e410b"); // change this to the identity of your ActionOffchainRollup
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
