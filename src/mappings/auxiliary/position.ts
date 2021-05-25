import { BigInt } from "@graphprotocol/graph-ts";
import { Action, Option, User } from "../../../generated/schema";
import { getOrCreatePosition } from "../../helpers";

export function updatePositionBuy(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsBought = position.optionsBought.plus(action.outputTokenA);
    position.premiumPaid = position.premiumPaid.plus(action.inputTokenB);
  }

  position.save();
}

export function updatePositionSell(
  user: User,
  option: Option,
  action: Action,
  optionsAmount: BigInt
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsSold = position.optionsSold.plus(optionsAmount);
    position.premiumReceived = position.premiumReceived.plus(
      action.outputTokenB
    );
  }

  position.save();
}

export function updatePositionResell(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsResold = position.optionsResold.plus(action.inputTokenA);
    position.premiumReceived = position.premiumReceived.plus(
      action.outputTokenB
    );
  }

  position.save();
}

export function updatePositionMint(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsMinted = position.optionsMinted.plus(action.outputTokenA);
  }

  position.save();
}

export function updatePositionUnmint(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsUnminted = position.optionsUnminted.plus(
      action.inputTokenA
    );
  }

  position.save();
}

export function updatePositionExercise(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsExercised = position.optionsExercised.plus(
      action.inputTokenA
    );
  }

  position.save();
}

export function updatePositionWithdraw(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.underlyingWithdrawn = position.underlyingWithdrawn.plus(
      action.outputTokenA
    );
    position.collateralWithdrawn = position.collateralWithdrawn.plus(
      action.outputTokenB
    );
  }

  position.save();
}

export function updatePositionAddLiquidity(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.initialOptionsProvided = position.initialOptionsProvided.plus(
      action.inputTokenA
    );
    position.initialTokensProvided = position.initialTokensProvided.plus(
      action.inputTokenB
    );
  }

  position.save();
}

export function updatePositionRemoveLiquidity(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.finalOptionsRemoved = position.finalOptionsRemoved.plus(
      action.outputTokenA
    );
    position.finalTokensRemoved = position.finalTokensRemoved.plus(
      action.outputTokenB
    );
  }

  position.save();
}

export function updatePositionTransferFrom(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsSent = position.optionsSent.plus(action.inputTokenA);
  }

  position.save();
}

export function updatePositionTransferTo(
  user: User,
  option: Option,
  action: Action
): void {
  let position = getOrCreatePosition(user, option);
  if (position) {
    position.optionsReceived = position.optionsReceived.plus(
      action.outputTokenA
    );
  }

  position.save();
}
