import { log, Address, BigInt } from "@graphprotocol/graph-ts";
import { Action, Pool, Option } from "../../../generated/schema";
import { OptionAMMPool as PoolContract } from "../../../generated/templates/OptionAMMPool/OptionAMMPool";
import { one, zero } from "../../constants";
import { getPoolById } from "../../helpers";

export function callNextSigma(pool: Pool): BigInt {
  let nextSigma = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_priceProperties();

  if (query.reverted) {
    log.info("[PodLog] Sigma call reverted", []);
  } else {
    nextSigma = query.value.value5;
    log.info("[PodLog] Sigma call value: {}", [query.value.value5.toString()]);
  }

  return nextSigma;
}

export function callNextBuyingPrice(pool: Pool): BigInt {
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getOptionTradeDetailsExactAOutput(one);

  if (query.reverted) {
    log.info("[PodLog] Buying price call reverted", []);
  } else {
    nextPrice = query.value.value0;
  }

  return nextPrice;
}

export function callNextSellingPrice(pool: Pool): BigInt {
  let nextPrice = zero;

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getOptionTradeDetailsExactAInput(one);

  if (query.reverted) {
    log.info("[PodLog] Selling price call reverted", []);
  } else {
    nextPrice = query.value.value0;
  }

  return nextPrice;
}

export function callNextPoolLiquidity(pool: Pool): BigInt[] {
  let balances = [zero, zero] as BigInt[];

  let contract = PoolContract.bind(Address.fromString(pool.id));
  let query = contract.try_getPoolBalances();

  if (query.reverted) {
    log.info("[PodLog] Selling price call reverted", []);
  } else {
    balances = [query.value.value0, query.value.value1];
  }

  return balances as BigInt[];
}

export function updateNextValues(option: Option, action: Action): Action {
  log.info("[PodLog] Op pool, {}", [option.pool.toString()]);

  let pool = getPoolById(option.pool);

  if (pool == null) return action;

  let nextSigma = callNextSigma(pool);
  let nextBuyingPrice = callNextBuyingPrice(pool);
  let nextSellingPrice = callNextSellingPrice(pool);

  action.nextSigma = nextSigma;
  action.nextBuyingPrice = nextBuyingPrice;
  action.nextSellingPrice = nextSellingPrice;

  let liquidity = callNextPoolLiquidity(pool);
  action.nextTokenALiquidity = liquidity[0];
  action.nextTokenBLiquidity = liquidity[1];

  return action;
}
