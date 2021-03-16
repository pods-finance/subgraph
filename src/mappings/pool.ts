import { log } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/OptionAMMFactory/OptionAMMFactory";
import { OptionAMMPool as PoolTemplate } from "../../generated/templates";
import { Pool } from "../../generated/schema";
import { getOptionById } from "../helpers";

export function handlePoolCreated(event: PoolCreated): void {
  let poolId = event.params.pool;
  let entity = new Pool(poolId.toHexString());
  let option = getOptionById(event.params.option.toHexString());

  if (option == null) {
    log.debug("[PodLog] Linked entities are missing: Option", []);
    return;
  }

  PoolTemplate.create(poolId);

  entity.from = event.params.deployer;
  entity.option = option.id;

  entity.save();
}
