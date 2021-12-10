import {
  OwnershipTransferred,
  ParameterSet,
  ModuleSet,
} from "../../generated/ConfigurationManager/ConfigurationManager";

import {
  OptionFactory,
  OptionHelper,
  PoolFactory,
} from "../../generated/schema";

import {
  OptionAMMFactory as PoolFactoryTemplate,
  OptionFactory as OptionFactoryTemplate,
  OptionHelper as OptionHelperTemplate,
} from "../../generated/templates";

import { getOrCreateManager, createConfiguration } from "../helpers";
import {
  MODULE_AMM_FACTORY,
  MODULE_OPTION_FACTORY,
  MODULE_OPTION_HELPER,
} from "../constants";

export function handleManagerOwnershipTransferred(
  event: OwnershipTransferred
): void {
  let manager = getOrCreateManager(event);
  let configuration = createConfiguration(event);

  configuration.owner = event.params.newOwner;
  manager.configuration = configuration.id;

  configuration.save();
  manager.save();
}

export function handleManagerParameterSet(event: ParameterSet): void {}

export function handleManagerModuleSet(event: ModuleSet): void {
  let manager = getOrCreateManager(event);
  let configuration = createConfiguration(event);

  let address = event.params.newAddress;

  if (address && event.params.name.toHexString() == MODULE_AMM_FACTORY) {
    let existing = PoolFactory.load(address.toHexString());
    if (existing != null) return;
    let module = new PoolFactory(address.toHexString());
    PoolFactoryTemplate.create(address);
    configuration.poolFactory = address.toHexString();
    configuration.save();
    module.save();
    manager.configuration = configuration.id;
    manager.save();
  } else if (
    address &&
    event.params.name.toHexString() == MODULE_OPTION_FACTORY
  ) {
    let existing = OptionFactory.load(address.toHexString());
    if (existing != null) return;
    let module = new OptionFactory(address.toHexString());
    OptionFactoryTemplate.create(address);
    configuration.optionFactory = address.toHexString();
    configuration.save();
    module.save();

    manager.configuration = configuration.id;
    manager.save();
  } else if (
    address &&
    event.params.name.toHexString() == MODULE_OPTION_HELPER
  ) {
    let existing = OptionHelper.load(address.toHexString());
    if (existing != null) return;
    let module = new OptionHelper(address.toHexString());
    OptionHelperTemplate.create(address);
    configuration.optionHelper = address.toHexString();
    configuration.save();
    module.save();

    manager.configuration = configuration.id;
    manager.save();
  }
}
