import { OptionCreated } from "../../generated/OptionFactory/OptionFactory";
import { PodOption as OptionTemplate } from "../../generated/templates";
import { Option } from "../../generated/schema";

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

  entity.save();
}
