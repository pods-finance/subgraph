import { log, Address, BigInt } from "@graphprotocol/graph-ts";

import { one, zero } from "../constants";
import { ERC20 as ERC20Contract } from "../../generated/templates/PodOption/ERC20";

export function convertExponentToBigInt(decimals: BigInt): BigInt {
  let base = BigInt.fromI32(1);
  for (let i = zero; i.lt(decimals); i = i.plus(one)) {
    base = base.times(BigInt.fromI32(10));
  }
  return base;
}

export function convertStringToPaddedZero(source: String): String {
  let result = source;
  while (result.length !== 66) {
    result = result.concat("0");
  }

  return result;
}

export function callERC20Symbol(address: Address): string {
  let contract = ERC20Contract.bind(address);
  let symbol = contract.symbol();

  return symbol;
}
