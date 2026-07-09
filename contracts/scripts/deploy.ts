import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  const ChromaClash = await ethers.getContractFactory("ChromaClash");
  const contract = await ChromaClash.deploy();
  await contract.waitForDeployment();
  console.log("ChromaClash deployed to:", await contract.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
