import {
  StaticPlatformPlugin,
  Logging,
  PlatformConfig,
  API,
  AccessoryPlugin,
} from "homebridge";
import {
  ShellSwitchAccessory,
  ShellSwitchAccessoryConfig,
} from "./shell-switch.accessory";

export interface ShellSwitchPlatformConfig {
  switches: ShellSwitchAccessoryConfig[];
}

export class ShellSwitchStaticPlatform implements StaticPlatformPlugin {
  constructor(
    private log: Logging,
    private config: PlatformConfig,
    private api: API
  ) {}

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(
      this.config?.switches.map(
        (switchConfig: ShellSwitchAccessoryConfig) =>
          new ShellSwitchAccessory(this.api.hap, this.log, switchConfig)
      )
    );
  }
}
