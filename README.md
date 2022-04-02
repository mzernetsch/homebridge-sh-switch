homebridge-sh-switch allows you to define switch accessories for homebridge using arbitary shell commands.

## Usage

You need to define `commands` and `matchers` in the configuration to interact with the shell and make the switch work.

### Commands

`Commands` are shell scripts that are executed to reach a certain state of the switch. A new shell will be spawned for every command.

- startup: Executed once after the initialization of the switch. Can be used to prepare the environment.
- ping: Find out the current state of the switch.
- on: Turn the switch on.
- off: Turn the switch off.

### Matchers

`Matchers` are regular expressions that are used to scan the stdout data of the shell after a command has been executed.

- on: If matches stdout, the state of the switch is considered on.
- off: If matches stdout, the state of the switch is considered off.

### Examples

#### Control TV using cec-client

```json
{
  "platform": "HomebridgeShSwitch",
  "name": "HomebridgeShSwitch",
  "switches": [
    {
      "name": "TV",
      "pingInterval": 1,
      "matchers": {
        "on": ["power status: on"],
        "off": ["power status: standby"]
      },
      "commands": {
        "on": ["echo 'on 0' | cec-client"],
        "off": ["echo 'standby 0' | cec-client"],
        "ping": ["echo 'pow 0' | cec-client"]
      }
    }
  ]
}
```

#### Control Windows PC using ssh and ping

```json
{
  "platform": "HomebridgeShSwitch",
  "name": "HomebridgeShSwitch",
  "switches": [
    {
      "name": "PC",
      "pingInterval": 5,
      "pingTimeout": 10,
      "matchers": {
        "on": [" 0% packet loss"],
        "off": [" 100% packet loss", "Name or service not known"]
      },
      "commands": {
        "on": ["ssh -f user@Desktop-SEZ2QAP 'echo'"],
        "off": [
          "ssh -f user@Desktop-SEZ2QAP '%windir%\\System32\\rundll32.exe powrprof.dll,SetSuspendState 0,1,0'"
        ],
        "ping": ["ping -W 1 -q -c 1 Desktop-SEZ2QAP"]
      }
    }
  ]
}
```
