import { API } from "homebridge";
import { ShellSwitchStaticPlatform } from "./platform";

export = (api: API) => {
  api.registerPlatform("HomebridgeShSwitch", ShellSwitchStaticPlatform);
};
