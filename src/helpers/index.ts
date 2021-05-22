import { log, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Action,
  Option,
  User,
  Pool,
  Position,
  OptionHourActivity,
  OptionDayActivity,
  SpotPrice,
} from "../../generated/schema";

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

function _generateActionId(id: string): string {
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

function _generateActivityId(
  type: string,
  optionId: string,
  index: string
): string {
  let id = "Activity"
    .concat("-")
    .concat(optionId)
    .concat("-")
    .concat(type)
    .concat("-")
    .concat(index);

  return id;
}

export function getOptionById(id: string): Option {
  let option = Option.load(id);
  return option as Option;
}

export function getPoolById(id: string): Pool {
  let pool = Pool.load(id);
  return pool as Pool;
}

export function getUserById(id: string): User {
  let user = User.load(id);
  return user as User;
}

export function getSpotPriceById(id: string): SpotPrice {
  let price = SpotPrice.load(id);
  return price as SpotPrice;
}

export function getOrCreateUserById(id: string): User {
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.save();
  }

  return user as User;
}

export function getActionById(id: string | null): Action {
  let actionId = _generateActionId(id);
  let action = Action.load(actionId);
  return action as Action;
}

export function createBaseAction(type: string, event: ethereum.Event): Action {
  let actionId = _generateActionId(event.transaction.hash.toHexString());
  let entity = new Action(actionId);

  entity.inputTokenA = zero;
  entity.inputTokenB = zero;
  entity.outputTokenA = zero;
  entity.outputTokenB = zero;

  let price = getSpotPriceById(actionId);
  if (price) entity.spotPrice = price.id;

  entity.from = event.transaction.from;
  entity.type = type;
  entity.hash = event.transaction.hash;
  entity.timestamp = event.block.timestamp.toI32();

  return entity;
}

export function getOrCreatePosition(user: User, option: Option): Position {
  let id = _generatePositionId(user.id, option.id);

  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);

    position.user = user.id;
    position.option = option.id;

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

    position.optionsSent = zero;
    position.optionsReceived = zero;

    position.optionsExercised = zero;
    position.underlyingWithdrawn = zero;
    position.collateralWithdrawn = zero;

    position.save();
  }

  return position as Position;
}

export function getOrCreateOptionHourActivity(
  option: Option,
  event: ethereum.Event
): OptionHourActivity {
  let timestamp = event.block.timestamp.toI32();
  let hourIndex = timestamp / (60 * 60);
  let dayIndex = timestamp / (60 * 60 * 24);

  let id = _generateActivityId(
    "hour",
    option.id,
    BigInt.fromI32(hourIndex).toString()
  );

  let activity = OptionHourActivity.load(id);
  if (activity == null) {
    activity = new OptionHourActivity(id);
    activity.option = option.id;
    activity.timestamp = timestamp;
    activity.day = dayIndex;
    activity.hour = hourIndex;

    activity.hourlyPremiumReceived = zero;
    activity.hourlyPremiumPaid = zero;
    activity.hourlyGrossVolumeOptions = zero;
    activity.hourlyGrossVolumeTokens = zero;
    activity.hourlyActionsCount = zero;
  }

  return activity as OptionHourActivity;
}

export function getOrCreateOptionDayActivity(
  option: Option,
  event: ethereum.Event
): OptionDayActivity {
  let timestamp = event.block.timestamp.toI32();
  let dayIndex = timestamp / (60 * 60 * 24);

  let id = _generateActivityId(
    "day",
    option.id,
    BigInt.fromI32(dayIndex).toString()
  );

  let activity = OptionDayActivity.load(id);
  if (activity == null) {
    activity = new OptionDayActivity(id);
    activity.option = option.id;
    activity.timestamp = timestamp;
    activity.day = dayIndex;

    activity.dailyPremiumReceived = zero;
    activity.dailyPremiumPaid = zero;
    activity.dailyGrossVolumeOptions = zero;
    activity.dailyGrossVolumeTokens = zero;
    activity.dailyActionsCount = zero;
  }

  return activity as OptionDayActivity;
}
