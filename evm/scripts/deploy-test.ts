import { ethers } from "hardhat";

async function main() {
  const TestPriceReceiver = await ethers.getContractFactory("TestPriceReceiver");

  const [deployer] = await ethers.getSigners();

  console.log('Deploying...');
  const receiver = await TestPriceReceiver.deploy();
  await Promise.all([
    receiver.deployed(),
  ])
  console.log('Deployed', {
    receiver: receiver.address,
  });

  console.log('Configuring...');
  await receiver.connect(deployer).getRecvLength();
  console.log('Done');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
