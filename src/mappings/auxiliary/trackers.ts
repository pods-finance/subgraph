import { log, Address, BigInt } from "@graphprotocol/graph-ts";
import { Action, Pool, Option } from "../../../generated/schema";
import { OptionAMMPool as PoolContract } from "../../../generated/templates/OptionAMMPool/OptionAMMPool";
import { ERC20 as ERC20Contract } from "../../../generated/templates/PodOption/ERC20";
import { isDev, one, zero } from "../../constants";
import { getPoolById, getUserById } from "../../helpers";

function callNextERC20Balance(address: Address, owner: Address): BigInt {
  let balance = zero;

  let contract = ERC20Contract.bind(address);
  let query = contract.try_balanceOf(owner);

  if (query.reverted) {
    log.info("PodLog ERC20 price call reverted", []);
  } else {
    balance = query.value;
  }

  return balance;
}

export function callNextSigma(pool: Pool): BigInt {
  let nextSigma = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_priceProperties();

  if (query.reverted) {
    log.info("PodLog Sigma call reverted", []);
  } else {
    nextSigma = query.value.value5;
    log.info("PodLog Sigma call value: {}", [query.value.value5.toString()]);
  }

  return nextSigma;
}

export function callNextBuyingPrice(pool: Pool, amount: BigInt): BigInt {
  if (amount == zero) return zero;
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getOptionTradeDetailsExactAOutput(amount);

  if (query.reverted) {
    log.info("PodLog] Buying price call reverted", []);
  } else {
    nextPrice = query.value.value0;
  }

  return nextPrice;
}

export function callNextSellingPrice(pool: Pool, amount: BigInt): BigInt {
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getOptionTradeDetailsExactAInput(amount);

  if (query.reverted) {
    log.info("PodLog Selling price call reverted", []);
  } else {
    nextPrice = query.value.value0;
  }

  return nextPrice;
}

export function callNextDynamicPrices(pool: Pool, reference: BigInt): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  let nextDynamicBuyingPrice = callNextBuyingPrice(pool, reference);
  let nextDynamicSellingPrice = callNextSellingPrice(pool, reference);

  balances = [nextDynamicBuyingPrice, nextDynamicSellingPrice];

  return balances;
}

export function callNextUserPoolLiquidity(pool: Pool, user: Address): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getRemoveLiquidityAmounts(
    BigInt.fromI32(100),
    BigInt.fromI32(100),
    user
  );

  if (query.reverted) {
    log.info("PodLog Pool liquidity for user call reverted", []);
  } else {
    balances = [query.value.value0, query.value.value1];
  }

  return balances as BigInt[];
}

export function callNextTBs(pool: Pool): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  balances[0] = callNextERC20Balance(
    Address.fromString(pool.tokenA.toString()),
    Address.fromString(pool.id)
  );
  balances[1] = callNextERC20Balance(
    Address.fromString(pool.tokenB.toString()),
    Address.fromString(pool.id)
  );

  return balances as BigInt[];
}

export function callNextDBs(pool: Pool): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let queryA = contract.try_deamortizedTokenABalance();
  if (queryA.reverted) {
    log.info("PodLog Pool DB(A) call reverted", []);
  } else {
    balances[0] = queryA.value;
  }

  let queryB = contract.try_deamortizedTokenBBalance();
  if (queryB.reverted) {
    log.info("PodLog Pool DB(B) call reverted", []);
  } else {
    balances[1] = queryB.value;
  }

  return balances as BigInt[];
}

export function callNextFees(pool: Pool): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  let contract = PoolContract.bind(Address.fromString(pool.id));

  let queryFeePoolA = contract.try_feePoolA();
  if (queryFeePoolA.reverted) {
    log.info("PodLog FeePoolA call reverted", []);
  } else {
    balances[0] = callNextERC20Balance(
      Address.fromHexString(pool.tokenA.toHexString()) as Address,
      queryFeePoolA.value
    );
  }

  let queryFeePoolB = contract.try_feePoolB();
  if (queryFeePoolB.reverted) {
    log.info("PodLog FeePoolB call reverted", []);
  } else {
    balances[1] = callNextERC20Balance(
      Address.fromHexString(pool.tokenB.toHexString()) as Address,
      queryFeePoolB.value
    );
  }

  return balances as BigInt[];
}

function callNextTVLs(pool: Pool): BigInt[] {
  let balances = [zero, zero, zero] as BigInt[];

  let nextCollateralTVL = callNextERC20Balance(
    Address.fromHexString(pool.tokenB.toHexString()) as Address,
    Address.fromString(pool.option) as Address
  );

  let nextPoolTokenATVL = callNextERC20Balance(
    Address.fromHexString(pool.tokenA.toHexString()) as Address,
    Address.fromHexString(pool.id) as Address
  ).times(callNextSellingPrice(pool, one));

  let nextPoolTokenBTVL = callNextERC20Balance(
    Address.fromHexString(pool.tokenB.toHexString()) as Address,
    Address.fromHexString(pool.id) as Address
  );

  balances = [nextCollateralTVL, nextPoolTokenATVL, nextPoolTokenBTVL];
  return balances as BigInt[];
}

export function updateNextValues(
  option: Option,
  action: Action,
  reference: BigInt
): Action {
  log.info("PodLog Op pool, {}", [option.pool.toString()]);

  if (!isDev()) return action;

  let pool = getPoolById(option.pool);
  let user = getUserById(action.user);

  if (pool == null) return action;

  let nextSigma = callNextSigma(pool);
  let nextBuyingPrice = callNextBuyingPrice(pool, one);
  let nextSellingPrice = callNextSellingPrice(pool, one);

  action.nextSigma = nextSigma;
  action.nextBuyingPrice = nextBuyingPrice;
  action.nextSellingPrice = nextSellingPrice;

  let liquidity = callNextUserPoolLiquidity(pool, Address.fromString(user.id));
  action.nextUserTokenALiquidity = liquidity[0];
  action.nextUserTokenBLiquidity = liquidity[1];

  let dynamicPrices = callNextDynamicPrices(pool, reference);
  action.nextDynamicBuyingPrice = dynamicPrices[0];
  action.nextDynamicSellingPrice = dynamicPrices[1];

  // let TBs = callNextTBs(pool);
  // action.nextTBA = TBs[0];
  // action.nextTBB = TBs[1];

  // let DBs = callNextDBs(pool);
  // action.nextTBA = DBs[0];
  // action.nextTBB = DBs[1];

  // let fees = callNextFees(pool);
  // action.nextFeesA = fees[0];
  // action.nextFeesB = fees[1];

  // let TVLs = callNextTVLs(pool);
  // action.nextCollateralTVL = TVLs[0];
  // action.nextPoolTokenATVL = TVLs[1];
  // action.nextPoolTokenBTVL = TVLs[2];

  return action;
}