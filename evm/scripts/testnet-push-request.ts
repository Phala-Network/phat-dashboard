import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0xdc64a140aa3e981100a9beca4e685f962f0cf6c9');
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Pushing a request...');
  await oracle.connect(deployer).request("0x01");
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
