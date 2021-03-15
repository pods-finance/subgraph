import { BigInt } from "@graphprotocol/graph-ts";

export let addresses: string[] = [
  "0x1acB2299Fa7285ABBB251a6075a31C4AeE1772D6", // optionFactory
  "0x2aFbdc587F9503d707aFf961fc2AB5AaBe45f056", // optionExchange
  "0x06CFf1Dc3cc6244E0D5ffbF2b9b98a4781C3E703", // optionAMMFactory
];

export let zero = BigInt.fromI32(0);
export let one = BigInt.fromI32(1);
