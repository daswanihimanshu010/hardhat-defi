const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");

async function main() {
  await getWeth();

  const { deployer } = await getNamedAccounts();

  // Lending Pool Address Provider: ILendingPoolAddressesProvider
  // Lending Pool: Lending Pool Address Provider will provide its address
  const lendingPool = await getLendingPool(deployer);

  // You can see this address on etherscan it is the real address of mainnet AAVE v2
  console.log(`Lending Pool Address: ${lendingPool.address}`);

  // Deposit Address
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // Approve first to deposit
  // I am approving this lendingPool from aave linked with my deployer
  // to deposit my WETH present on WETH token contract as a collateral
  await approveERC20(wethAddress, lendingPool.address, AMOUNT, deployer);
  console.log("Depositing...");

  // Deposit
  await lendingPool.deposit(wethAddress, AMOUNT, deployer, 0);
  console.log("Deposited...");

  // how much we have borrowed, how much we have in collateral, how much we can borrow
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // getting current DAI/ETH price
  const daiPrice = await getDaiPrice();

  // converting daiPrice in terms of our collateral ETH to see how much DAI we can borrow
  // We are borrowing 95% of what we can borrow that is why 0.95
  const amountDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber());

  console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`);

  // converting the DAI we can borrow in WEI (18 decimal spaces)
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );

  // Borrow

  // DAI contract address ethereum mainnet etherscan
  // Got from https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f

  const daiContractAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDAI(
    daiContractAddress,
    lendingPool,
    amountDaiToBorrowWei,
    deployer
  );

  // print values after borrow to see what we have borrrowed
  await getBorrowUserData(lendingPool, deployer);

  // Repay
  await repay(daiContractAddress, lendingPool, amountDaiToBorrowWei, deployer);

  // print values after repay to see what we have repaid
  await getBorrowUserData(lendingPool, deployer);
}

async function repay(daiAddress, lendingPool, daiToBorrowInWEI, account) {
  // first we need to approve our DAI sending to AAVE
  await approveERC20(
    daiAddress,
    lendingPool.address,
    daiToBorrowInWEI,
    account
  );

  const repayTx = await lendingPool.repay(
    daiAddress,
    daiToBorrowInWEI,
    1,
    account
  );

  await repayTx.wait(1);

  console.log("Repaid!!");
}

async function borrowDAI(daiAddress, lendingPool, daiToBorrowInWEI, account) {
  const borrowTx = await lendingPool.borrow(
    daiAddress, // asset address what we need to borrow
    daiToBorrowInWEI, // how much we need to borrow
    1,
    0,
    account // on whose behalf address
  );
  await borrowTx.wait(1);
  console.log(`You have borrowed!!`);
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  // getting price feed contract address for DAI/ETH from chainlink price feed oracles:
  // https://docs.chain.link/docs/data-feeds/price-feeds/addresses/#Ethereum%20Mainnet
  // We are not connecting deployer in above getContractAt because we are just reading data not
  // sending any transaction

  const price = (await daiEthPriceFeed.latestRoundData())[1]; // 1st index means answer in  latestRoundData()
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);

  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`);

  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool(account) {
  const lendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", // lendingPoolAddressProvider contract address got form aave: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts
    account
  );

  // getting lendingpool from lendingPoolAddressProvider as shown in aave docs
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();

  const lendingPoolContract = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );

  return lendingPoolContract;
}

async function approveERC20(
  erc20Address,
  spenderAddress, // the account that needs approval
  amountToSpend,
  account
) {
  // We are using ERC20 interface because WETH is ETH in terms of ERC20 token
  // That is why we are passing weth address as second parameter
  // We are calling ERC20 token contract because we need to approve the spenderAddress to spend some
  // amount from my wethaddress.
  // WETH = ERC20 of ETH
  // So I am asking for permission to spend my ETH
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address,
    account
  );
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
