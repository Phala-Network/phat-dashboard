import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensPubOracle");

  const [deployer] = await ethers.getSigners();

  const oracle = await TestLensOracle.attach('0xCe2D36084c2b9F49bf1Cfd1E6A27a2e92454705d'); // change this to your client smart contract address
  await Promise.all([
    oracle.deployed(),
  ])

  console.log('Pushing a request...');
  // await oracle.connect(deployer).requestWhoMirroredPub("0x09-0x01", "");
  // await oracle.connect(deployer).requestWhoMirroredPub("0x09-0x01", "{\\\"offset\\\":2}");
  await oracle.connect(deployer).requestWhoMirroredPub("0x02ed-0x03bb-DA-f5b14cbb", "");
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
