import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import * as environment from "./env";

import { convertStringToPaddedZero } from "../helpers/utils";

export function isTransferTracked(): boolean {
  return false;
}

export function isDev(): boolean {
  return environment.dev;
}

export function getManagerId(): string {
  return environment.manager;
}

export let zero = BigInt.fromI32(0);
export let one = BigInt.fromI32(1);
export let two = BigInt.fromI32(2);
export let d18 = BigInt.fromI32(18);

export let put = 0;
export let call = 1;

export let ADDRESS_ZERO = Bytes.fromHexString(
  "0x0000000000000000000000000000000000000000"
);

export let MODULE_AMM_FACTORY = convertStringToPaddedZero(
  Bytes.fromUTF8("AMM_FACTORY").toHexString()
);
export let MODULE_OPTION_FACTORY = convertStringToPaddedZero(
  Bytes.fromUTF8("OPTION_FACTORY").toHexString()
);
export let MODULE_OPTION_HELPER = convertStringToPaddedZero(
  Bytes.fromUTF8("OPTION_HELPER").toHexString()
);
