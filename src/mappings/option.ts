import { OptionCreated } from "../../generated/ConfigurationManager/OptionFactory";
import { PodOption as OptionTemplate } from "../../generated/templates";
import { PodOption as OptionContract } from "../../generated/templates/PodOption/PodOption";
import { Option } from "../../generated/schema";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateManager } from "../helpers";
import { ADDRESS_ZERO } from "../constants";

export function _handleOptionRequired(
  event: ethereum.Event,
  optionId: Address
): Option {
  let entity = new Option(optionId.toHexString());
  let contract = OptionContract.bind(optionId);
  OptionTemplate.create(optionId);

  entity.from = ADDRESS_ZERO;
  entity.optionType = contract.optionType();

  entity.underlyingAsset = contract.underlyingAsset();
  entity.strikeAsset = contract.strikeAsset();
  entity.strikePrice = contract.strikePrice();

  entity.expiration = contract.expiration();
  entity.exerciseStart = contract.startOfExerciseWindow();
  entity.exerciseWindowSize = entity.expiration.minus(entity.exerciseStart);

  entity.underlyingAssetDecimals = BigInt.fromI32(
    contract.underlyingAssetDecimals()
  );
  entity.strikeAssetDecimals = BigInt.fromI32(contract.strikeAssetDecimals());

  entity.factory = null;
  getOrCreateManager(event);

  entity.save();

  return entity as Option;
}

export function handleOptionCreated(event: OptionCreated): void {
  let optionId = event.params.option;
  let entity = new Option(optionId.toHexString());

  OptionTemplate.create(optionId);

  entity.from = event.params.deployer;
  entity.optionType = event.params._optionType;

  entity.underlyingAsset = event.params.underlyingAsset;
  entity.strikeAsset = event.params.strikeAsset;
  entity.strikePrice = event.params.strikePrice;

  entity.expiration = event.params.expiration;
  entity.exerciseWindowSize = event.params.exerciseWindowSize;

  entity.exerciseStart = event.params.expiration.minus(
    event.params.exerciseWindowSize
  );

  let contract = OptionContract.bind(optionId);
  entity.underlyingAssetDecimals = BigInt.fromI32(
    contract.underlyingAssetDecimals()
  );
  entity.strikeAssetDecimals = BigInt.fromI32(contract.strikeAssetDecimals());

  entity.factory = event.address.toHexString();
  getOrCreateManager(event);

  entity.save();
}
