import { execSync } from "child_process";
import {
  AccessoryPlugin,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
  CharacteristicEventTypes,
  HAPStatus,
} from "homebridge";

export interface ShellSwitchAccessoryConfig {
  name: string;
  debug?: boolean;
  pingInterval?: number;
  pingTimeout?: number;
  matchers: {
    on: string | string[];
    off: string | string[];
  };
  commands: {
    startup?: string | string[];
    ping?: string | string[];
    on: string | string[];
    off: string | string[];
  };
}

export class ShellSwitchAccessory implements AccessoryPlugin {
  private readonly hap: HAP;

  private readonly log: Logging;

  private readonly switchService: Service;

  private readonly config: ShellSwitchAccessoryConfig;

  private pingTimeout?: NodeJS.Timeout;

  get name(): string {
    return this.config.name;
  }

  constructor(hap: HAP, log: Logging, config: ShellSwitchAccessoryConfig) {
    this.hap = hap;
    this.log = log;
    this.config = config;

    this.switchService = new hap.Service.Switch(this.config.name);

    this.switchService
      .getCharacteristic(hap.Characteristic.On)
      .on(
        CharacteristicEventTypes.GET,
        (callback: CharacteristicGetCallback) => {
          this.executeShellCommands(this.config.commands.ping);

          callback(
            HAPStatus.SUCCESS,
            this.switchService.getCharacteristic(hap.Characteristic.On).value
          );
        }
      )
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.executeShellCommands(
            value ? this.config.commands.on : this.config.commands.off
          );

          if (this.config.pingTimeout) {
            if (this.pingTimeout) {
              clearTimeout(this.pingTimeout);
            }

            this.pingTimeout = setTimeout(() => {
              this.pingTimeout = undefined;
            }, this.config.pingTimeout * 1000);
          }

          callback(HAPStatus.SUCCESS);
        }
      );

    this.executeShellCommands(this.config.commands.startup);

    if (this.config.pingInterval) {
      setInterval(() => {
        if (this.pingTimeout) {
          return;
        }

        this.executeShellCommands(this.config.commands.ping);
      }, this.config.pingInterval * 1000);
    }
  }

  identify(): void {}

  getServices(): Service[] {
    return [this.switchService];
  }

  private executeShellCommands(commands: string | string[] | undefined) {
    if (!commands) {
      return;
    }

    if (typeof commands === "string") {
      commands = [commands];
    }

    commands.forEach((command) => {
      if (this.config.debug) {
        this.log(`Executing command: "${command}".`);
      }

      let stdout;
      try {
        stdout = execSync(command);
      } catch (error: any) {
        stdout = error.stdout;
      }

      if (this.config.debug) {
        this.log(stdout);
      }

      this.handleShellResult(stdout);
    });
  }

  private handleShellResult(stdout: Buffer) {
    const currentStatus = this.switchService.getCharacteristic(
      this.hap.Characteristic.On
    ).value;

    const dataString = stdout.toString();

    if (
      currentStatus === false &&
      this.checkMatch(this.config.matchers.on, dataString)
    ) {
      this.switchService.updateCharacteristic(this.hap.Characteristic.On, true);
    }

    if (
      currentStatus === true &&
      this.checkMatch(this.config.matchers.off, dataString)
    ) {
      this.switchService.updateCharacteristic(
        this.hap.Characteristic.On,
        false
      );
    }
  }

  private checkMatch(matchers: string | string[] | undefined, data: string) {
    if (!matchers) {
      return;
    }

    if (typeof matchers === "string") {
      matchers = [matchers];
    }

    return matchers.some((matcher) => data.match(matcher));
  }
}
