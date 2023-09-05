import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensPubOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0xCe2D36084c2b9F49bf1Cfd1E6A27a2e92454705d'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Setting attestor ...');
  await oracle.connect(deployer).setAttestor("0x601e4173fb8f1650ac83b884b25b261145d85518"); // change this to the identity of your ActionOffchainRollup
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
