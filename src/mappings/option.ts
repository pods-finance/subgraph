import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { OptionCreated } from "../../generated/ConfigurationManager/OptionFactory";
import { PodOption as OptionTemplate } from "../../generated/templates";
import { PodOption as OptionContract } from "../../generated/templates/PodOption/PodOption";
import { Option } from "../../generated/schema";
import { getOrCreateManager, callERC20Symbol } from "../helpers";
import { ADDRESS_ZERO, zero } from "../constants";

export function handleOptionRequired(
  event: ethereum.Event,
  optionId: Address
): Option {
  let entity = new Option(optionId.toHexString());
  let contract = OptionContract.bind(optionId);
  OptionTemplate.create(optionId);

  entity.address = optionId;

  entity.from = ADDRESS_ZERO as Bytes;
  entity.type = contract.optionType();

  entity.underlyingAsset = contract.underlyingAsset();
  entity.strikeAsset = contract.strikeAsset();
  entity.strikePrice = contract.strikePrice();

  entity.expiration = contract.expiration();
  entity.exerciseStart = contract.startOfExerciseWindow();
  entity.exerciseWindowSize = entity.expiration.minus(
    (entity.exerciseStart || zero) as BigInt
  );

  entity.underlyingAssetDecimals = BigInt.fromI32(
    contract.underlyingAssetDecimals()
  );
  entity.strikeAssetDecimals = BigInt.fromI32(contract.strikeAssetDecimals());

  entity.underlyingAssetSymbol = callERC20Symbol(
    entity.underlyingAsset as Address
  );
  entity.strikeAssetSymbol = callERC20Symbol(entity.strikeAsset as Address);

  entity.factory = null;
  getOrCreateManager(event);

  entity.save();

  return entity as Option;
}

export function handleOptionCreated(event: OptionCreated): void {
  let optionId = event.params.option;
  let entity = handleOptionRequired(event, optionId);
  entity.factory = event.address.toHexString();

  entity.save();

  // let entity = new Option(optionId.toHexString());

  // OptionTemplate.create(optionId);

  // entity.address = optionId;
  // entity.from = event.params.deployer;
  // entity.type = event.params._optionType;

  // entity.underlyingAsset = event.params.underlyingAsset;
  // entity.strikeAsset = event.params.strikeAsset;
  // entity.strikePrice = event.params.strikePrice;

  // entity.expiration = event.params.expiration;
  // entity.exerciseWindowSize = event.params.exerciseWindowSize;

  // entity.exerciseStart = event.params.expiration.minus(
  //   event.params.exerciseWindowSize
  // );

  // let contract = OptionContract.bind(optionId);
  // entity.underlyingAssetDecimals = BigInt.fromI32(
  //   contract.underlyingAssetDecimals()
  // );
  // entity.strikeAssetDecimals = BigInt.fromI32(contract.strikeAssetDecimals());

  // entity.factory = event.address.toHexString();
  // getOrCreateManager(event);

  // entity.save();
}
