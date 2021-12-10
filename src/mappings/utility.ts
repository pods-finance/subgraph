import { log } from "@graphprotocol/graph-ts";
import { TradeInfo } from "../../generated/ConfigurationManager/OptionAMMPool";
import { FeeWithdrawn } from "../../generated/ConfigurationManager/FeePool";
import { SpotPrice, Fee } from "../../generated/schema";

import {
  getActionById,
  getFeePoolById,
  getOrCreateMetadataById,
  createFeeByIdAndType,
} from "../helpers";

export function handleSpotPrice(event: TradeInfo): void {
  let spotId = event.transaction.hash.toHexString();
  let action = getActionById(spotId);

  let entity = new SpotPrice(spotId);
  entity.value = event.params.spotPrice;

  if (action !== null) {
    entity.action = action.id;
    action.spotPrice = spotId;
    action.save();
  }

  entity.save();
}

export function handleFeeWithdrawn(event: FeeWithdrawn): void {
  let transactionId = event.transaction.hash.toHexString();
  let address = event.address.toHexString();

  /**
   * Create Fee and bind to FeePool
   */

  let feePool = getFeePoolById(address);
  if (feePool === null) {
    log.debug("PodLog Fee Linked entities are missing: FeePool", []);
    return;
  }

  let fee = createFeeByIdAndType(transactionId, feePool.type);
  fee.value = event.params.amountWithdrawn;
  fee.feePool = feePool.id;

  /**
   * Bind Fee to Action Metadata (if already created, based on order of parsing events)
   * --- If the Action is not yet registered, the flow will be reversed: Fee will be fetched in createBaseAction
   */

  let action = getActionById(transactionId, "RemoveLiquidity");
  if (action !== null) {
    let metadata = getOrCreateMetadataById(action.metadata);
    if (metadata !== null) {
      if (feePool.type === "A") metadata.feeA = fee.id;
      else if (feePool.type === "B") metadata.feeB = fee.id;

      fee.metadata = metadata.id;
      fee.action = action.id;

      metadata.save();
    }
  }

  fee.save();
}
