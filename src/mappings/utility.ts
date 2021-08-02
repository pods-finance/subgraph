import { TradeInfo } from "../../generated/ConfigurationManager/OptionAMMPool";
import { SpotPrice } from "../../generated/schema";

import { getActionById } from "../helpers";

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

  // TODO :: Fix the TransferTo/TransferFrom duplicates
  // if (action.type === "TransferTo" || action.type === "TransferFrom") {
  //   let sister = getActionById(spotId, "2");
  //   if (sister !== null) {
  //     sister.spotPrice = spotId;
  //     sister.save();
  //   }
  // }

  entity.save();
}
