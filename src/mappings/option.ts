import { Address, BigInt } from "@graphprotocol/graph-ts";
import { OptionCreated } from "../../generated/ConfigurationManager/OptionFactory";
import { PodOption as OptionTemplate } from "../../generated/templates";
import { PodOption as OptionContract } from "../../generated/templates/PodOption/PodOption";
import { Option } from "../../generated/schema";
import { getOrCreateManager, callERC20Symbol } from "../helpers";
import { zero, put } from "../constants";

export function handleOptionCreated(event: OptionCreated): void {
  let optionId = event.params.option;
  let entity = new Option(optionId.toHexString());
  let contract = OptionContract.bind(optionId);
  OptionTemplate.create(optionId);

  /**
   * ---- Base option data ----
   */

  entity.address = optionId;
  entity.from = event.params.deployer;
  entity.type = event.params._optionType;
  entity.exerciseType = event.params._exerciseType;
  entity.decimals = BigInt.fromI32(contract.decimals());
  entity.symbol = contract.symbol();
  entity.factory = event.address.toHexString();

  entity.strikePrice = event.params.strikePrice;
  entity.expiration = event.params.expiration.toI32();
  entity.exerciseWindowSize = event.params.exerciseWindowSize.toI32();
  entity.exerciseStart = event.params.expiration
    .minus((event.params.exerciseWindowSize || zero) as BigInt)
    .toI32();

  /**
   * ---- Underlying and Strike assets ----
   */

  entity.underlyingAsset = event.params.underlyingAsset;
  entity.strikeAsset = event.params.strikeAsset;

  entity.underlyingAssetDecimals = BigInt.fromI32(
    contract.underlyingAssetDecimals()
  );
  entity.strikeAssetDecimals = BigInt.fromI32(contract.strikeAssetDecimals());

  entity.underlyingAssetSymbol = callERC20Symbol(
    Address.fromString(entity.underlyingAsset.toHexString())
  );
  entity.strikeAssetSymbol = callERC20Symbol(
    Address.fromString(entity.strikeAsset.toHexString())
  );

  /**
   * ---- Inferred Collateral asset ----
   */

  entity.collateralAsset =
    entity.type === put ? entity.strikeAsset : entity.underlyingAsset;
  entity.collateralAssetDecimals =
    entity.type === put
      ? entity.strikeAssetDecimals
      : entity.underlyingAssetDecimals;
  entity.collateralAssetSymbol =
    entity.type === put
      ? entity.strikeAssetSymbol
      : entity.underlyingAssetSymbol;

  /**
   * ---- Dependencies ----
   */

  getOrCreateManager(event);

  entity.save();
}
