import { BigInt } from "@graphprotocol/graph-ts";

export let addresses: string[] = [
  "0xFB91fdE1622BC8d366824e4E67bd9a3edA9C69f0", // optionFactory
  "0xc1a2891B292F070BEe7610b2B4A833Ca2BC17a99", // OptionHelper
  "0x8F041613b613c0383bc5c1236f991457896540ec", // optionAMMFactory
];

export let zero = BigInt.fromI32(0);
export let one = BigInt.fromI32(1);
