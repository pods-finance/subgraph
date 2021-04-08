import { BigInt, dataSource, log } from "@graphprotocol/graph-ts";

import * as kovan from "./kovan";
import * as mainnet from "./mainnet";
import * as mumbai from "./mumbai";
import * as matic from "./matic";

export function addresses(): string[] {
  let network = dataSource.network();

  if (network == "kovan")
    return [kovan.optionFactory, kovan.optionHelper, kovan.optionAMMFactory];
  else if (network == "mainnet")
    return [
      mainnet.optionFactory,
      mainnet.optionHelper,
      mainnet.optionAMMFactory,
    ];
  else if (network == "mumbai")
    return [mumbai.optionFactory, mumbai.optionHelper, mumbai.optionAMMFactory];
  else if (network == "matic")
    return [matic.optionFactory, matic.optionHelper, matic.optionAMMFactory];
  else return [kovan.optionFactory, kovan.optionHelper, kovan.optionAMMFactory]; // throw new Error("Unsupported network");
}

export let zero = BigInt.fromI32(0);
export let one = BigInt.fromI32(1);
