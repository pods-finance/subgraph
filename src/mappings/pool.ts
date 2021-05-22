import { log, ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/ConfigurationManager/OptionAMMFactory";
import { OptionAMMPool as PoolTemplate } from "../../generated/templates";
import { OptionAMMPool as PoolContract } from "../../generated/templates/OptionAMMPool/OptionAMMPool";
import { Pool } from "../../generated/schema";
import { callERC20Symbol, getOptionById, getOrCreateManager } from "../helpers";

export function handlePoolRequired(
  event: ethereum.Event,
  poolId: Address
): void {
  let entity = new Pool(poolId.toHexString());
  let contract = PoolContract.bind(poolId);
  PoolTemplate.create(poolId);
  /**
   * Get the factory, find the optionId by asking the factory
   * Link the option to the pool in that way (if the option is not yet registered it may need to be)
   */
}

export function handlePoolCreated(event: PoolCreated): void {
  let poolId = event.params.pool;

  // handlePoolCreated(event, poolId);

  let entity = new Pool(poolId.toHexString());
  let option = getOptionById(event.params.option.toHexString());

  if (option == null) {
    log.debug("PodLog Linked entities are missing: Option", []);
    return;
  }

  PoolTemplate.create(poolId);

  entity.address = poolId;
  entity.from = event.params.deployer;
  entity.option = option.id;

  option.pool = entity.id;

  let contract = PoolContract.bind(poolId);

  entity.tokenADecimals = BigInt.fromI32(contract.tokenADecimals());
  entity.tokenBDecimals = BigInt.fromI32(contract.tokenBDecimals());

  entity.tokenA = event.params.option;
  entity.tokenB = contract.tokenB();

  entity.tokenASymbol = callERC20Symbol(event.params.option);
  entity.tokenBSymbol = callERC20Symbol(contract.tokenB());

  entity.factory = event.address.toHexString();
  getOrCreateManager(event);

  entity.save();
  option.save();
}
