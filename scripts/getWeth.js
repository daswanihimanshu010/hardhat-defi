const { getNamedAccounts, ethers } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.02");

async function getWeth() {
  // In order to interact with contract we need an account
  const { deployer } = await getNamedAccounts();

  // call "deposit" function on WETH contract
  // we need abi, contract address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

  // getContractAt function of ethers returns contract deployed at specific address
  const iWeth = await ethers.getContractAt(
    "IWeth", // abi
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH contract address
    deployer // account associated
  );

  // depositing Weth to deploer account
  const deployedWethContract = await iWeth.deposit({ value: AMOUNT });
  await deployedWethContract.wait(1);

  // getting deployer weth balance
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`WETH balance: ${wethBalance.toString()} WETH`);
}

module.exports = { getWeth, AMOUNT };
