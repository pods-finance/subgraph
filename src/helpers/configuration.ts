import { ethereum, log, Bytes } from "@graphprotocol/graph-ts";
import {
  Manager,
  Configuration,
  OptionHelper,
  OptionFactory,
  PoolFactory,
} from "../../generated/schema";

import { ADDRESS_ZERO, getManagerId } from "../constants";

function _generateConfigurationId(event: ethereum.Event): string {
  let id = "Configuration"
    .concat("-")
    .concat(event.transaction.hash.toHexString());
  return id;
}

export function getOrCreateManager(event: ethereum.Event): Manager {
  let id = getManagerId();
  log.error("PodLog Manager Id", [id]);
  let manager = Manager.load(id);
  if (manager == null) {
    manager = new Manager(id);
    manager.owner = ADDRESS_ZERO as Bytes;

    let configurationId = _generateConfigurationId(event);
    let configuration = new Configuration(configurationId);
    configuration.manager = manager.id;
    configuration.save();

    log.error("PodLog Configuration Id", [configuration.id]);

    manager.configuration = configuration.id;
    manager.save();
  }

  return manager as Manager;
}

export function createConfiguration(event: ethereum.Event): Configuration {
  let managerId = getManagerId();
  let manager = Manager.load(managerId);

  let current = Configuration.load(manager.configuration);

  let configuration = new Configuration(_generateConfigurationId(event));
  configuration.manager = manager.id;
  configuration.optionFactory = current.optionFactory;
  configuration.optionHelper = current.optionHelper;
  configuration.poolFactory = current.poolFactory;

  configuration.save();
  return configuration as Configuration;
}

export function getConfigurationById(id: string): Configuration {
  let configuration = Configuration.load(id);
  return configuration as Configuration;
}

export function getOptionHelperById(id: string): OptionHelper {
  let helper = OptionHelper.load(id);
  return helper as OptionHelper;
}

export function getOptionFactoryById(id: string): OptionFactory {
  let factory = OptionFactory.load(id);
  return factory as OptionFactory;
}

export function getPoolFactoryById(id: string): PoolFactory {
  let factory = PoolFactory.load(id);
  return factory as PoolFactory;
}

export function getActiveConfiguration(event: ethereum.Event): Configuration {
  let manager = getOrCreateManager(event);
  let configuration = getConfigurationById(manager.configuration);

  return configuration as Configuration;
}
