import { log, BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/ConfigurationManager/OptionAMMFactory";
import { OptionAMMPool as PoolTemplate } from "../../generated/templates";
import { OptionAMMPool as PoolContract } from "../../generated/templates/OptionAMMPool/OptionAMMPool";
import { Pool } from "../../generated/schema";
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
   * ---- Dependencies ----
   */

  option.pool = entity.id;
  getOrCreateManager(event);

  entity.save();
  option.save();
}
