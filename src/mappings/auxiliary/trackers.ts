import { log, Address, BigInt } from "@graphprotocol/graph-ts";
import { Action, Pool, Option, User } from "../../../generated/schema";
import { OptionAMMPool as PoolContract } from "../../../generated/templates/OptionAMMPool/OptionAMMPool";
import { ERC20 as ERC20Contract } from "../../../generated/templates/PodOption/ERC20";
import { isDev, one, zero } from "../../constants";
import {
  getPoolById,
  getUserById,
  convertExponentToBigInt,
} from "../../helpers";

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

export function callNextIV(pool: Pool): BigInt {
  let nextIV = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_priceProperties();

  if (query.reverted) {
    log.info("PodLog IV call reverted", []);
  } else {
    nextIV = query.value.value5;
    log.info("PodLog IV call value: {}", [query.value.value5.toString()]);
  }

  return nextIV;
}

export function callNextBuyingPrice(pool: Pool, amount: BigInt): BigInt {
  if (amount == zero) return zero;
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getOptionTradeDetailsExactAOutput(amount);

  if (query.reverted) {
    log.info("PodLog Buying price call reverted", []);
  } else {
    nextPrice = query.value.value0;
  }

  return nextPrice;
}

export function callNextABPrice(pool: Pool): BigInt {
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getABPrice();

  if (query.reverted) {
    log.info("PodLog Buying price call reverted", []);
  } else {
    nextPrice = query.value;
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
    Address.fromString(pool.tokenA.toHexString()),
    Address.fromString(pool.id)
  );
  balances[1] = callNextERC20Balance(
    Address.fromString(pool.tokenB.toHexString()),
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
      Address.fromString(pool.tokenB.toHexString()),
      queryFeePoolA.value as Address
    );
  }

  let queryFeePoolB = contract.try_feePoolB();
  if (queryFeePoolB.reverted) {
    log.info("PodLog FeePoolB call reverted", []);
  } else {
    balances[1] = callNextERC20Balance(
      Address.fromString(pool.tokenB.toHexString()),
      queryFeePoolB.value as Address
    );
  }

  return balances as BigInt[];
}

function callNextTVLs(pool: Pool): BigInt[] {
  let balances = [zero, zero, zero] as BigInt[];
  let oneAdapted = one.times(convertExponentToBigInt(pool.tokenADecimals));

  let nextCollateralTVL = callNextERC20Balance(
    Address.fromString(pool.tokenB.toHexString()),
    Address.fromString(pool.option)
  );

  let nextPoolTokenATVL = callNextERC20Balance(
    Address.fromString(pool.tokenA.toHexString()),
    Address.fromString(pool.id)
  ).times(callNextSellingPrice(pool, oneAdapted));

  let nextPoolTokenBTVL = callNextERC20Balance(
    Address.fromString(pool.tokenB.toHexString()),
    Address.fromString(pool.id)
  );

  balances = [nextCollateralTVL, nextPoolTokenATVL, nextPoolTokenBTVL];
  return balances as BigInt[];
}

export function callNextUserSnapshot(user: User, pool: Pool): BigInt[] {
  let snapshot = [zero, zero, zero] as BigInt[];

  let contract = PoolContract.bind(Address.fromString(pool.id));

  let query = contract.try_getUserDepositSnapshot(Address.fromString(user.id));
  if (query.reverted) {
    log.info("PodLog Snapshot call reverted", []);
  } else {
    snapshot = [query.value.value0, query.value.value1, query.value.value2];
  }

  return snapshot as BigInt[];
}

export function updateNextValues(
  option: Option,
  action: Action,
  reference: BigInt
): Action {
  if (!isDev()) return action;

  let pool = option && option.pool ? getPoolById(option.pool!) : null;
  let user = getUserById(action.user);

  if (user == null || pool == null) return action;
  let oneAdapted = one.times(convertExponentToBigInt(pool.tokenADecimals));

  let nextIV = callNextIV(pool);
  let nextBuyingPrice = callNextBuyingPrice(pool, oneAdapted);
  let nextSellingPrice = callNextSellingPrice(pool, oneAdapted);

  action.nextIV = nextIV;
  action.nextBuyingPrice = nextBuyingPrice;
  action.nextSellingPrice = nextSellingPrice;

  let liquidity = callNextUserPoolLiquidity(pool, Address.fromString(user.id));
  action.nextUserTokenALiquidity = liquidity[0];
  action.nextUserTokenBLiquidity = liquidity[1];

  let dynamicPrices = callNextDynamicPrices(pool, reference);
  action.nextDynamicBuyingPrice = dynamicPrices[0];
  action.nextDynamicSellingPrice = dynamicPrices[1];

  let TBs = callNextTBs(pool);
  action.nextTBA = TBs[0];
  action.nextTBB = TBs[1];

  let DBs = callNextDBs(pool);
  action.nextDBA = DBs[0];
  action.nextDBB = DBs[1];

  let fees = callNextFees(pool);
  action.nextFeesA = fees[0];
  action.nextFeesB = fees[1];

  let TVLs = callNextTVLs(pool);
  action.nextCollateralTVL = TVLs[0];
  action.nextPoolTokenATVL = TVLs[1];
  action.nextPoolTokenBTVL = TVLs[2];

  let snapshot = callNextUserSnapshot(user, pool);
  action.nextUserTokenAOriginalBalance = snapshot[0];
  action.nextUserTokenBOriginalBalance = snapshot[1];
  action.nextUserSnapshotFIMP = snapshot[2];

  let ABPrice = callNextABPrice(pool);
  action.nextABPrice = ABPrice;

  return action;
}
