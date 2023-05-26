import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0x2a6a5d59564C470f6aC3E93C4c197251F31EBCf8'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Pushing a malformed request...');
  await oracle.connect(deployer).malformedRequest("0x01");
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
