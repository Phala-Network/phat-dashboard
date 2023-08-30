import { ethers } from "hardhat";

async function main() {
  const TestLensOracle = await ethers.getContractFactory("TestLensPubOracle");

  const [deployer] = await ethers.getSigners();

  console.log('Deploying...');
  const attestor = deployer.address;  // When deploy for real e2e test, change it to the real attestor wallet.
  console.log('with argument ', attestor);
  const oracle = await TestLensOracle.deploy(attestor);
  await oracle.deployed();
  console.log('Deployed', {
    oracle: oracle.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
