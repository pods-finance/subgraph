import {
  Action,
  Fee,
  FeePool,
  Metadata,
  Option,
  Pool,
  Position,
  SpotPrice,
  User,
} from "../../generated/schema";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { zero } from "../constants";

export {
  createConfiguration,
  getConfigurationById,
  getActiveConfiguration,
  getOrCreateManager,
  getOptionFactoryById,
  getOptionHelperById,
  getPoolFactoryById,
} from "./configuration";

export {
  convertExponentToBigInt,
  convertStringToPaddedZero,
  callERC20Symbol,
} from "./utils";

function _generateActionId(id: string, suffix: string | null): string {
  if (suffix) return id + "-" + suffix;
  return id;
}

function _generatePositionId(userId: string, optionId: string): string {
  let id = "Position"
    .concat("-")
    .concat(userId)
    .concat("-")
    .concat(optionId);

  return id;
}

function _generateFeeId(transactionId: string, type: string): string {
  let id = "Fee"
    .concat("-")
    .concat(transactionId)
    .concat("-")
    .concat(type);

  return id;
}

export function getOptionById(id: string): Option | null {
  let option = Option.load(id);
  return option;
}

export function getPoolById(id: string): Pool | null {
  let pool = Pool.load(id);
  return pool;
}

export function getUserById(id: string): User | null {
  let user = User.load(id);
  return user;
}

export function getSpotPriceById(id: string): SpotPrice | null {
  let price = SpotPrice.load(id);
  return price;
}

export function getOrCreateUserById(id: string): User {
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.address = Address.fromString(id);
    user.save();
  }

  return user as User;
}

export function getActionById(
  id: string,
  suffix: string | null = null
): Action | null {
  let actionId = _generateActionId(id, suffix);
  let action = Action.load(actionId);
  return action;
}
export function getActionByIdFromEvent(
  event: ethereum.Event,
  suffix: string | null = null
): Action | null {
  let actionId = _generateActionId(
    event.transaction.hash.toHexString(),
    suffix
  );
  let action = Action.load(actionId);
  return action;
}

export function createBaseAction(
  type: string,
  event: ethereum.Event,
  suffix: string | null = null
): Action {
  let transactionId = event.transaction.hash.toHexString();
  let actionId = _generateActionId(transactionId, suffix);
  let entity = new Action(actionId);

  entity.inputTokenA = zero;
  entity.inputTokenB = zero;
  entity.outputTokenA = zero;
  entity.outputTokenB = zero;

  entity.from = event.transaction.from;
  entity.type = type;
  entity.hash = event.transaction.hash;
  entity.timestamp = event.block.timestamp.toI32();

  /**
   * ---- Handle spot price ----
   */

  let price = getSpotPriceById(actionId);
  if (price) entity.spotPrice = price.id;

  /**
   * ---- Handle metadata ----
   * [It may have been already created by the Fee events]
   */

  let metadata = getOrCreateMetadataById(transactionId);
  if (metadata) entity.metadata = metadata.id;

  /**
   * ---- Handle fees ----
   * [This case should handle Fee(s) that are registered before the Action]
   */

  let feeA = getFeeByIdAndType(transactionId, "A");
  if (feeA !== null) {
    feeA.metadata = metadata.id;
    feeA.action = entity.id;

    metadata.feeA = feeA.id;

    feeA.save();
    metadata.save();
  }

  let feeB = getFeeByIdAndType(transactionId, "B");
  if (feeB !== null) {
    feeB.metadata = metadata.id;
    feeB.action = entity.id;

    metadata.feeB = feeB.id;

    feeB.save();
    metadata.save();
  }

  return entity;
}

export function getOrCreatePosition(user: User, option: Option): Position {
  let id = _generatePositionId(user.id, option.id);

  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);

    position.user = user.id;
    position.option = option.id;
    position.expiration = option.expiration;
    position.optionType = option.type;

    position.premiumPaid = zero;
    position.premiumReceived = zero;

    position.optionsBought = zero;
    position.optionsSold = zero;
    position.optionsResold = zero;

    position.optionsMinted = zero;
    position.optionsUnminted = zero;

    position.initialOptionsProvided = zero;
    position.initialTokensProvided = zero;

    position.finalOptionsRemoved = zero;
    position.finalTokensRemoved = zero;

    position.remainingOptionsProvided = zero;
    position.remainingTokensProvided = zero;

    position.optionsSent = zero;
    position.optionsReceived = zero;

    position.optionsExercised = zero;
    position.underlyingWithdrawn = zero;
    position.strikeWithdrawn = zero;

    position.save();
  }

  return position as Position;
}

export function getFeePoolById(id: string): FeePool | null {
  let feePool = FeePool.load(id);
  return feePool;
}

export function getOrCreateMetadataById(id: string): Metadata {
  let metdata = Metadata.load(id);
  if (metdata == null) {
    metdata = new Metadata(id);
    metdata.id = id;
    metdata.save();
  }

  return metdata as Metadata;
}

export function getFeeByFeeId(id: string): Fee | null {
  let fee = Fee.load(id);
  return fee;
}

export function getFeeByIdAndType(
  transactionId: string,
  type: string
): Fee | null {
  let id = _generateFeeId(transactionId, type);
  let fee = Fee.load(id);
  return fee;
}

export function createFeeByIdAndType(transactionId: string, type: string): Fee {
  let fee = new Fee(_generateFeeId(transactionId, type));
  return fee as Fee;
}
