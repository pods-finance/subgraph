import { log, store, BigInt } from "@graphprotocol/graph-ts";
import {
  OptionsBought,
  OptionsSold,
} from "../../generated/OptionExchange/OptionExchange";
import {
  Exercise,
  Mint,
  Unmint,
  Withdraw,
} from "../../generated/templates/PodOption/PodOption";
import { Transfer } from "../../generated/templates/PodOption/ERC20";
import {
  AddLiquidity,
  RemoveLiquidity,
} from "../../generated/templates/OptionAMMPool/OptionAMMPool";

import {
  getOrCreateUserById,
  getOptionById,
  getPoolById,
  getActionById,
  createBaseAction,
  convertExponentToBigInt,
} from "../helpers";

import { addresses } from "../constants";
import * as positionHandler from "./auxiliary/position";
import * as statsHander from "./auxiliary/activity";
import * as trackHandler from "./auxiliary/trackers";

export function handleBuy(event: OptionsBought): void {
  let action = createBaseAction("Buy", event);
  let user = getOrCreateUserById(event.params.buyer.toHexString());
  let option = getOptionById(event.params.optionAddress.toHexString());

  if (user == null || option == null) {
    log.debug("Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;

  action.inputTokenB = event.params.inputSold;
  action.outputTokenA = event.params.optionsBought;

  positionHandler.updatePositionBuy(user, option, action);
  statsHander.updateActivityBuy(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}
export function handleSell(event: OptionsSold): void {
  let action = createBaseAction("Sell", event);
  let user = getOrCreateUserById(event.params.seller.toHexString());
  let option = getOptionById(event.params.optionAddress.toHexString());

  if (user == null || option == null) {
    log.debug("Linked entities are missing: User / Option", []);
    return;
  }

  let pool = getPoolById(option.pool);

  /**
   * Safety check: is there a Mint event pre-registered by the transaction
   */

  let existing = getActionById(null, "Mint", event);
  if (existing) {
    store.remove("Action", existing.id);
    log.debug("[PodLog] Removed existing Mint for Sale.", []);
  }

  action.user = user.id;
  action.option = option.id;

  action.inputTokenB = option.strikePrice
    .times(event.params.optionsSold)
    .div(convertExponentToBigInt(pool.tokenADecimals));
  action.outputTokenB = event.params.outputBought;

  positionHandler.updatePositionSell(
    user,
    option,
    action,
    event.params.optionsSold
  );
  statsHander.updateActivitySell(
    option,
    action,
    event,
    event.params.optionsSold
  );
  action = trackHandler.updateNextValues(option, action);

  action.save();
}

export function handleMint(event: Mint): void {
  let action = createBaseAction("Mint", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());

  if (user == null || option == null) {
    log.debug("[PodLog] Linked entities are missing: User / Option", []);
    return;
  }

  let pool = getPoolById(option.pool);

  action.user = user.id;
  action.option = option.id;

  action.inputTokenB = option.strikePrice
    .times(event.params.amount)
    .div(convertExponentToBigInt(pool.tokenADecimals));
  action.outputTokenA = event.params.amount;

  positionHandler.updatePositionMint(user, option, action);
  statsHander.updateActivityMint(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}
export function handleUnmint(event: Unmint): void {
  let action = createBaseAction("Unmint", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());

  if (user == null || option == null) {
    log.debug("[PodLog] Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;

  action.inputTokenA = event.params.optionAmount;
  action.outputTokenB = event.params.strikeAmount;

  positionHandler.updatePositionUnmint(user, option, action);
  statsHander.updateActivityUnmint(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}

export function handleExercise(event: Exercise): void {
  let action = createBaseAction("Exercise", event);
  let user = getOrCreateUserById(event.transaction.from.toHexString());
  let option = getOptionById(event.address.toHexString());

  if (user == null || option == null) {
    log.debug("[PodLog] Linked entities are missing: User / Option", []);
    return;
  }

  let pool = getPoolById(option.pool);

  action.user = user.id;
  action.option = option.id;

  action.inputTokenA = event.params.amount;
  action.outputTokenB = option.strikePrice
    .times(event.params.amount)
    .div(convertExponentToBigInt(pool.tokenADecimals));

  positionHandler.updatePositionExercise(user, option, action);
  statsHander.updateActivityExercise(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}
export function handleWithdraw(event: Withdraw): void {
  let action = createBaseAction("Withdraw", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());

  if (user == null || option == null) {
    log.debug("[PodLog] Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;

  action.outputTokenA = event.params.underlyingAmount;
  action.outputTokenB = event.params.strikeAmount;

  positionHandler.updatePositionWithdraw(user, option, action);
  statsHander.updateActivityWithdraw(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}
export function handleAddLiquidity(event: AddLiquidity): void {
  let action = createBaseAction("AddLiquidity", event);
  let user = getOrCreateUserById(event.params.owner.toHexString());
  let pool = getPoolById(event.address.toHexString());

  if (user == null || pool == null) {
    log.debug("[PodLog] Linked entities are missing: User / Pool", []);
    return;
  }

  action.user = user.id;
  action.pool = pool.id;
  action.option = pool.option;

  action.inputTokenA = event.params.amountA;
  action.inputTokenB = event.params.amountB;

  let option = getOptionById(pool.option);

  positionHandler.updatePositionAddLiquidity(user, option, action);
  statsHander.updateActivityAddLiquidity(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let action = createBaseAction("RemoveLiquidity", event);
  let user = getOrCreateUserById(event.params.caller.toHexString());
  let pool = getPoolById(event.address.toHexString());

  if (user == null || pool == null) {
    log.debug("[PodLog] Linked entities are missing: User / Pool", []);
    return;
  }

  action.user = user.id;
  action.pool = pool.id;
  action.option = pool.option;

  action.outputTokenA = event.params.amountA;
  action.outputTokenB = event.params.amountB;

  let option = getOptionById(pool.option);

  positionHandler.updatePositionRemoveLiquidity(user, option, action);
  statsHander.updateActivityRemoveLiquidity(option, action, event);
  action = trackHandler.updateNextValues(option, action);

  action.save();
}

export function handleOptionTransfer(event: Transfer): void {
  let option = getOptionById(event.address.toHexString());

  if (option == null) {
    log.debug("[PodLog] Linked entities are missing: Option", []);
    return;
  }

  let blacklist = addresses;
  blacklist.push(option.id);
  blacklist.push(option.pool);

  if (
    blacklist.includes(event.transaction.from.toHexString()) ||
    blacklist.includes(event.transaction.to.toHexString())
  ) {
    return;
  }

  let actionFrom = createBaseAction("TransferFrom", event);
  let actionTo = createBaseAction("TransferTo", event);

  let userFrom = getOrCreateUserById(event.params.from.toHexString());
  let userTo = getOrCreateUserById(event.params.to.toHexString());

  if (userFrom == null || userTo === null) {
    log.debug("[PodLog] Linked entities are missing: User (2)", []);
    return;
  }

  actionFrom.user = userFrom.id;
  actionTo.user = userTo.id;

  actionFrom.option = option.id;
  actionTo.option = option.id;

  actionFrom.inputTokenA = event.params.value;
  actionTo.outputTokenA = event.params.value;

  positionHandler.updatePositionTransferFrom(userFrom, option, actionFrom);
  positionHandler.updatePositionTransferTo(userTo, option, actionTo);
  statsHander.updateActivityTransfer(option, actionFrom, event);
  actionFrom = trackHandler.updateNextValues(option, actionFrom);
  actionTo = trackHandler.updateNextValues(option, actionTo);

  actionFrom.save();
  actionTo.save();
}
