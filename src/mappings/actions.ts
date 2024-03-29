import * as positionHandler from "./auxiliary/position";
import * as trackHandler from "./auxiliary/trackers";

import { ADDRESS_ZERO, call, isTransferTracked, put, zero } from "../constants";
import {
  AddLiquidity,
  RemoveLiquidity,
} from "../../generated/templates/OptionAMMPool/OptionAMMPool";
import { Address, log, store } from "@graphprotocol/graph-ts";
import {
  Exercise,
  Mint,
  Unmint,
  Withdraw,
} from "../../generated/templates/PodOption/PodOption";
import {
  OptionsBought,
  OptionsMintedAndSold,
  OptionsSold,
} from "../../generated/ConfigurationManager/OptionHelper";
import {
  convertExponentToBigInt,
  createBaseAction,
  getActionById,
  getActionByIdFromEvent,
  getOptionById,
  getOptionFactoryById,
  getOptionHelperById,
  getOrCreateMetadataById,
  getOrCreateUserById,
  getPoolById,
  getPoolFactoryById,
} from "../helpers";

import { Metadata } from "../../generated/schema";
import { Transfer } from "../../generated/templates/PodOption/ERC20";

export function handleBuy(event: OptionsBought): void {
  let action = createBaseAction("Buy", event);
  let user = getOrCreateUserById(event.params.buyer.toHexString());
  let option = getOptionById(event.params.optionAddress.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Buy Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.inputTokenB = event.params.inputSold;
  action.outputTokenA = event.params.optionsBought;

  positionHandler.updatePositionBuy(user, option, action);
  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.optionsBought
  );

  action.save();
}
export function handleSell(event: OptionsMintedAndSold): void {
  let id = event.transaction.hash.toHexString();
  let action = createBaseAction("Sell", event);
  let metadata = getOrCreateMetadataById(action.metadata);
  let user = getOrCreateUserById(event.params.seller.toHexString());
  let option = getOptionById(event.params.optionAddress.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Sell Linked entities are missing: User / Option", []);
    return;
  }

  /**
   * Safety check: is there a Mint event pre-registered by the transaction
   */

  let existing = getActionById(id);
  if (existing && existing.type == "Mint") {
    store.remove("Action", existing.id);
    log.debug("PodLog Sell Removed existing Mint for Sale.", []);
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.outputTokenB = event.params.outputBought;
  if (option.type === put) {
    action.inputTokenB = option.strikePrice
      .times(event.params.optionsMintedAndSold)
      .div(convertExponentToBigInt(pool.tokenADecimals));
  } else if (option.type === call) {
    action.inputTokenA = event.params.optionsMintedAndSold;
  }

  metadata.optionsMintedAndSold = event.params.optionsMintedAndSold;
  action.metadata = metadata.id;
  metadata.save();

  positionHandler.updatePositionSell(
    user,
    option,
    action,
    event.params.optionsMintedAndSold
  );

  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.optionsMintedAndSold
  );

  action.save();
}

export function handleResell(event: OptionsSold): void {
  let action = createBaseAction("Resell", event);
  let user = getOrCreateUserById(event.params.seller.toHexString());
  let option = getOptionById(event.params.optionAddress.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Resell Linked entities are missing: User / Option", []);
    return;
  }

  /**
   * Safety check: is there a Mint event pre-registered by the transaction
   */

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.inputTokenA = event.params.optionsSold;
  action.outputTokenB = event.params.outputReceived;

  positionHandler.updatePositionResell(user, option, action);
  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.optionsSold
  );

  action.save();
}

export function handleMint(event: Mint): void {
  let action = createBaseAction("Mint", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug(
      "PodLog Mint Linked entities are missing: User / Option / Pool",
      []
    );
    return;
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.outputTokenA = event.params.amount;

  if (option.type === put) {
    action.inputTokenB = option.strikePrice
      .times(event.params.amount)
      .div(convertExponentToBigInt(pool.tokenADecimals));
  } else if (option.type === call) {
    action.inputTokenA = event.params.amount;
  }

  positionHandler.updatePositionMint(user, option, action);
  action = trackHandler.updateNextValues(option, action, event.params.amount);

  action.save();
}
export function handleUnmint(event: Unmint): void {
  let action = createBaseAction("Unmint", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Unmint Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.inputTokenA = event.params.optionAmount;

  if (option.type === put) {
    action.outputTokenB = event.params.strikeAmount;
  } else if (option.type === call) {
    action.outputTokenA = event.params.optionAmount;
  }

  positionHandler.updatePositionUnmint(user, option, action);
  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.optionAmount
  );

  action.save();
}

export function handleExercise(event: Exercise): void {
  let action = createBaseAction("Exercise", event);
  let user = getOrCreateUserById(event.transaction.from.toHexString());
  let option = getOptionById(event.address.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Exercise Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  if (option.type === put) {
    action.inputTokenA = event.params.amount;
    action.outputTokenB = option.strikePrice
      .times(event.params.amount)
      .div(convertExponentToBigInt(pool.tokenADecimals));
  } else if (option.type === call) {
    action.inputTokenA = event.params.amount;
    action.inputTokenB = option.strikePrice
      .times(event.params.amount)
      .div(convertExponentToBigInt(pool.tokenADecimals));

    action.outputTokenA = event.params.amount;
  }

  positionHandler.updatePositionExercise(user, option, action);
  action = trackHandler.updateNextValues(option, action, zero);

  action.save();
}
export function handleWithdraw(event: Withdraw): void {
  let action = createBaseAction("Withdraw", event);
  let user = getOrCreateUserById(event.params.minter.toHexString());
  let option = getOptionById(event.address.toHexString());
  let pool = option && option.pool ? getPoolById(option.pool!) : null;

  if (user == null || option == null || pool == null) {
    log.debug("PodLog Withdraw Linked entities are missing: User / Option", []);
    return;
  }

  action.user = user.id;
  action.option = option.id;
  action.pool = pool.id;
  action.optionType = option.type;

  action.outputTokenA = event.params.underlyingAmount;
  action.outputTokenB = event.params.strikeAmount;

  positionHandler.updatePositionWithdraw(user, option, pool, action);
  action = trackHandler.updateNextValues(option, action, zero);

  action.save();
}
export function handleAddLiquidity(event: AddLiquidity): void {
  let action = createBaseAction("AddLiquidity", event);
  let user = getOrCreateUserById(event.params.owner.toHexString());
  let pool = getPoolById(event.address.toHexString());
  let option = pool && pool.option ? getOptionById(pool.option) : null;
  if (option == null || user == null || pool == null) {
    log.debug(
      "PodLog AddLiquidity Linked entities are missing: User / Pool",
      []
    );
    return;
  }

  let existing = getActionById(action.id);
  if (existing && existing.type == "Mint") {
    store.remove("Action", existing.id);
    log.debug("PodLog Add Liquidity Removed existing Mint for Sale.", []);
  }

  action.user = user.id;
  action.pool = pool.id;
  action.option = pool.option;
  action.optionType = option.type;

  action.inputTokenA = event.params.amountA;
  action.inputTokenB = event.params.amountB;

  positionHandler.updatePositionAddLiquidity(user, option, pool, action);
  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.amountA || zero
  );

  action.save();
}
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let action = createBaseAction("RemoveLiquidity", event);
  let user = getOrCreateUserById(event.params.caller.toHexString());
  let pool = getPoolById(event.address.toHexString());
  let option = pool && pool.option ? getOptionById(pool.option) : null;

  if (option == null || user == null || pool == null) {
    log.debug(
      "PodLog RemoveLiquidity Linked entities are missing: User / Pool",
      []
    );
    return;
  }

  action.user = user.id;
  action.pool = pool.id;
  action.option = pool.option;
  action.optionType = option.type;

  action.outputTokenA = event.params.amountA;
  action.outputTokenB = event.params.amountB;

  positionHandler.updatePositionRemoveLiquidity(user, option, pool, action);
  action = trackHandler.updateNextValues(
    option,
    action,
    event.params.amountA || zero
  );

  action.save();
}

export function handleOptionTransfer(event: Transfer): void {
  if (!isTransferTracked()) return;
  let option = getOptionById(event.address.toHexString());
  if (option == null) {
    log.debug("PodLog Linked entities are missing: Option", []);
    return;
  }
  /**
   * Check for blacklist - transfers happening on between contracts
   */
  if (
    Address.fromString(event.params.from.toHexString()) === ADDRESS_ZERO ||
    Address.fromString(event.params.to.toHexString()) === ADDRESS_ZERO ||
    getOptionFactoryById(event.params.from.toHexString()) != null ||
    getOptionHelperById(event.params.from.toHexString()) != null ||
    getPoolFactoryById(event.params.from.toHexString()) != null ||
    getOptionFactoryById(event.params.to.toHexString()) != null ||
    getOptionHelperById(event.params.to.toHexString()) != null ||
    getPoolFactoryById(event.params.to.toHexString()) != null
  ) {
    return;
  }
  /**
   * Check for existing options/pools with the from/to addresses
   */
  if (
    getPoolById(event.params.from.toHexString()) != null ||
    getOptionById(event.params.from.toHexString()) != null ||
    getPoolById(event.params.to.toHexString()) != null ||
    getOptionById(event.params.to.toHexString()) != null
  ) {
    return;
  }

  let existing = getActionByIdFromEvent(event);
  if (existing) {
    log.debug("PodLog Transfer existing actions.", []);
    return;
  }

  let actionTo = createBaseAction("TransferTo", event);
  let actionFrom = createBaseAction("TransferFrom", event, "2");
  let userFrom = getOrCreateUserById(event.params.from.toHexString());
  let userTo = getOrCreateUserById(event.params.to.toHexString());
  if (userFrom == null || userTo === null) {
    log.debug("PodLog Linked entities are missing: User (2)", []);
    return;
  }
  actionFrom.user = userFrom.id;
  actionTo.user = userTo.id;
  actionFrom.option = option.id;
  actionTo.option = option.id;
  actionFrom.optionType = option.type;
  actionTo.optionType = option.type;

  actionFrom.inputTokenA = event.params.value;
  actionTo.outputTokenA = event.params.value;
  positionHandler.updatePositionTransferFrom(userFrom, option, actionFrom);
  positionHandler.updatePositionTransferTo(userTo, option, actionTo);
  actionFrom = trackHandler.updateNextValues(option, actionFrom, zero);
  actionTo = trackHandler.updateNextValues(option, actionTo, zero);

  actionTo.save();
  actionFrom.save();
}
