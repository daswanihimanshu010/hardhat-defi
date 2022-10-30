# Defi (Defi Quant Enginner)

-> Decentralzied finance, submitting collatral, getting loan or a coin in exchange, repaying, liquidated in case of not paid.

# DefiLama

Holds info of all USD locked in DEFi, NFTs.

https://defillama.com/

# Aave

https://aave.com/

-> Borrowing and Lending protocol. It helps in borrowing and lending crypto currency.

-> Someone can earn put their cryptocurrency as collateral and earn yields from that borrowing makes.

-> Unique: Non custodial, does not touches our money just smart contract interacting.

-> https://app.aave.com/ to test UI of lending and borrowing of AAVE.

-> While borrowing, Health Factor is the variable that shows much vulnerable you are for being liquidated.

-> They also use chainlink to get the live price feed for conversion when lending and borrowing.

-> Hosted on IPFS.

# DAI

-> Price always pegged to $1.

# Uniswap: Haven for trading

-> Decentralized trading app, automated market maker, like stock exchange but with tokens.

-> Everything happening is transperant.

# WETH (Wrapped ETH)

-> When we send, receive ETH it sends via WETH. WETH is ETH in ERC20 token because many protocols like AAVE itself interacts with ERC20 token because it becomes easy to lend, borrow, send, receive.

Visit https://goerli.etherscan.io/token/0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6#writeContract

-> Here you can see if you deposit ETH via deposit function in write contract after connecting to metamask, copy the contract address and import tokens in metamask it will show you WETH.

# Forking Mainnet

-> Forking blockchain means duplicating a blockchain in our local environment like duplicating mainnet.

-> You can either deploy mocks like we did in previous project or fork the mainnet to see how our contract will run on live blockchain.

# To do it programatically: lending and borrowing

1. Deposit collateral: ETH / WETH

-> First we have get WETH token as AAVE interacts only with ERC20 token and ETH in ERC20 contract is called WETH. So we created a scripts named getWeth.js to get our WETH token.

-> To get the abi we copy pasted the IWeth.sol in contracts/interfaces and run `yarn hardhat compile`.

-> Get contract address from ETH mainnet. Visit https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, we are going to fork mainnet that is why we are using mainnet contract address.

-> Now to run IWeth.sol we have to either deploy its mock and then use its address or we can fork the mainnet. To fork mainnet we have to just mention `forking url` in `networks` array in `hardhat.config.js`.

-> Now we can call `getWeth.js` export in `aaveBorrow.js` and run `yarn hardhat run scripts/aaveBorrow.js`

-> Now we have WETH tokens so we can deposit into AAVE. How to do that?

-> To deposit WETH as collatral in AAVE:

The way AAVE works is that it has a contract that points us to right contract address.

All the lending is done by LendingPool: https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool

And the contract that points us to right contract address is LendingPoolAddressesProvider: https://docs.aave.com/developers/v/2.0/the-core-protocol/addresses-provider

LendingPoolAddressesProvider contract will tell us what is the address of LendingPool is.

We can got to deployed smart contracts in LendingPoolAddressesProvider to the address of the contract on mainnet: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts

Mainnet LendingPoolAddressesProvider contract: https://etherscan.io/address/0xb53c1a33016b2dc2ff3653530bff1848a515c8c5#code

-> `We don't have to do this step as we are importing AAVE protocol v2 below and it already has LendingPoolAddressesProvider` Now we will copy paste LendingPoolAddressesProvider from aave docs as an interface in our contracts section and then run `yarn hardhat compile` to get the abi.

-> In ILendingPoolAddressesProvider.sol there is a function called `getLendingPool()` which returns address of Lending pool.

-> After we get address for `Lending Pool` we can get its abi by deploying its interface from aave docs and importing aave protocol to solve import errors `yarn add @aave/protocol-v2` and running `yarn hardhat compile` to get the abi of `LendingPool`.

-> Now we have to deposit the WETH in AAVE protocol and to deposit in `ILendingPool.sol` you can see `deposit()` function to see parameters. This LendingPool deposit() function will pull the WETH out of our wallet and deposit into AAVE as lending but to provide that ability we need to approve the lending pool address first so it can use funds from our wallet address.

-> Now we need to approve that the WETH address mentioned in `getWeth.js` can be used by `lending pool` of AAVE so we copy paste the interface of ERC20 token in contracts/interfaces and see it implementation in `aaveBorrow.js` in `approveERC20()`.

---

`Approve Pattern Confusing ?? Just Remember!!`

a. You need to go to your token contract (like WETH) and approve the vendor to take the money permission.

(We are using ERC20 interface in `approveERC20()` function of `aaveBorrow.js` because WETH is ETH in terms of ERC20 token)

b. Then in second transaction you need to go to vendor and then the vendor will grab the money from the token contract and do something else.

`(The way we are depositing our WETH in token contract by getting the public address of token contract from the mainnet etherscan and vendor is interacting with the token contract to find the amount deposited by user address to grab and do something.)`

---

2. Borrow another asset: DAI

-> how much we have borrowed, how much we have in collateral, how much we can borrow ?

-> `getUserAccountData()` helps in doing that. Visit: https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#getuseraccountdata

a. `Loan to value (ltv)` means if you have 1 ETH `totalCollateralETH` so you cannot borrow items worth 1 ETH. That value will be smaller and is called `availableBorrowsETH`.

A risk analysis can be done here: `https://docs.aave.com/risk/asset-risk/risk-parameters#risk-parameters-analysis`.

b. `Liquitation threshold` https://docs.aave.com/risk/asset-risk/risk-parameters#liquidation-threshold

Liquidation threshold of 80% means that if the value rises above 80% of the collateral, the position is undercollateralised and could be liquidated.

c. `health factor` if your health factor is below 1 you get `liquidated`. https://docs.aave.com/risk/asset-risk/risk-parameters#health-factor

d. `liquidationCall()` function to liquidate somebody. https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#liquidationcall

-> After getting this info, we need define the conversion rate of the coin that we need to borrow. This means we will get a value of how much DAI we can borrow with the ETH we have as collateral. And to get the current value of DAI we have to use chainlink priceFeeds.

-> Checkout from line 35 in `aaveBorrow.js` to see how we get the current price feed of DAI, calculate how much DAI we can ask fo, for our collateral ETH and how to convert the borrow DAI into WEI.

-> And then we borrow: https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#borrow

`function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)`

`interestRateMode is 1 for stable and 2 for variable.`

3. Repay the DAI

-> Now to repay again we have to approve our sending our DAI back to AAVE.

-> And then visit for repay function docs: https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#repay

-> Even after repaying your borrowed DAI, there is some amount left in your borrowed value, this is because it is the interest that you were charged when you borrowed DAI and you can repay this small amount using `Uniswap` to clear your interests and keep your collateral free.

-> When we deposit in AAVe it gives aWETH, an interest that you get for lending your collateral in AAVE. This is how you can earn using AAVE.

`Note: Important link to practice your solidity concepts: speedrunethereum`
