import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0x6D3c87968E9F637aBfE2ed4d1376242AF482dEbB');
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Pushing a request...');
  await oracle.connect(deployer).setAttestor("0x4122088e9273f4245f29c98fa1e3854c84971293");
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
