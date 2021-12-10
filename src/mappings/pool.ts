import { log, BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/ConfigurationManager/OptionAMMFactory";
import {
  OptionAMMPool as PoolTemplate,
  FeePool as FeePoolTemplate,
} from "../../generated/templates";
import { OptionAMMPool as PoolContract } from "../../generated/templates/OptionAMMPool/OptionAMMPool";
import {} from "../../generated/templates";
import { Pool, FeePool } from "../../generated/schema";
import { callERC20Symbol, getOptionById, getOrCreateManager } from "../helpers";

export function handlePoolCreated(event: PoolCreated): void {
  let poolId = event.params.pool;

  let entity = new Pool(poolId.toHexString());
  let option = getOptionById(event.params.option.toHexString());

  if (option == null) {
    log.debug("PodLog Linked entities are missing: Option", []);
    return;
  }

  PoolTemplate.create(poolId);
  let contract = PoolContract.bind(poolId);

  /**
   * ---- Base pool data ----
   */

  entity.address = poolId;
  entity.from = event.params.deployer;
  entity.option = option.id;
  entity.factory = event.address.toHexString();

  /**
   * ---- TokenA and TokenB assets ----
   */

  entity.tokenA = event.params.option;
  entity.tokenB = contract.tokenB();

  entity.tokenADecimals = BigInt.fromI32(contract.tokenADecimals());
  entity.tokenBDecimals = BigInt.fromI32(contract.tokenBDecimals());

  entity.tokenASymbol = callERC20Symbol(event.params.option);
  entity.tokenBSymbol = callERC20Symbol(contract.tokenB());

  /**
   * ---- Fee Pools ----
   */

  let feePoolAAddress = contract.feePoolA();
  let feePoolA = new FeePool(feePoolAAddress.toHexString());

  FeePoolTemplate.create(feePoolAAddress);

  feePoolA.address = feePoolAAddress;
  feePoolA.type = "A";
  feePoolA.save();

  let feePoolBAddress = contract.feePoolB();
  let feePoolB = new FeePool(feePoolBAddress.toHexString());

  FeePoolTemplate.create(feePoolBAddress);

  feePoolB.address = feePoolBAddress;
  feePoolB.type = "B";
  feePoolB.save();

  entity.feePoolA = feePoolA.id;
  entity.feePoolB = feePoolB.id;

  /**
   * ---- Dependencies ----
   */

  option.pool = entity.id;
  getOrCreateManager(event);

  entity.save();
  option.save();
}
