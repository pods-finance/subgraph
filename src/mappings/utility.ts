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

  entity.save();
}
