import { ethereum } from "@graphprotocol/graph-ts";
import { Action, Option } from "../../../generated/schema";
import {
  getOrCreateOptionHourActivity,
  getOrCreateOptionDayActivity,
} from "../../helpers";

import { one } from "../../constants";

export function updateActivityBuy(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyPremiumPaid = hour.hourlyPremiumPaid.plus(action.inputTokenB);
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyPremiumPaid = day.dailyPremiumPaid.plus(action.inputTokenB);
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivitySell(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyPremiumReceived = hour.hourlyPremiumReceived.plus(
      action.outputTokenB
    );
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyPremiumPaid = day.dailyPremiumPaid.plus(action.outputTokenB);
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityMint(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityUnmint(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityExercise(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityWithdraw(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityAddLiquidity(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityRemoveLiquidity(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}

export function updateActivityTransfer(
  option: Option,
  action: Action,
  event: ethereum.Event
): void {
  let hour = getOrCreateOptionHourActivity(option, event);
  let day = getOrCreateOptionDayActivity(option, event);
  if (hour) {
    hour.hourlyActionsCount = hour.hourlyActionsCount.plus(one);
    hour.save();
  }

  if (day) {
    day.dailyActionsCount = day.dailyActionsCount.plus(one);
    day.save();
  }
}
