import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensPubOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0x94Af64b38E27acD8b0B01dBCF214536D4a357A3c'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Pushing a request...');
  await oracle.connect(deployer).requestWhoMirroredPub("0x09-0x01", "");
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
