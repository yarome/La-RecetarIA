# Agent Operating Rules — La RecetarIA Workspace

This file applies to every AI agent session opened on this workspace. Treat it as binding. If a task seems to require crossing any boundary defined here, stop and ask the user before proceeding.

## Privacy & Filesystem Boundary

### Allowed locations

The agent may read, write, list, and search inside:

- The current workspace folder and every subfolder. The workspace is the folder Cursor was opened on (currently `D:\! Proyectos\2. Aplicación\`). Subfolders the agent creates during a task (for example `la-recetaria/`) are part of the workspace and are fully accessible.
- The `D:\` volume, but **only** for tooling the user has explicitly placed there. Currently:
  - `D:\Node\` — Node.js + npm binaries.
  - `D:\Git\` — Git binaries.
  Use these paths to invoke executables. Do not browse them for content beyond confirming an executable exists.

Anything outside the locations above is off limits unless the user explicitly authorises it in the current conversation.

### Forbidden locations (no read, no list, no glob, no grep, no stat)

- `C:\Users\<anyone>\` outside this workspace — including `Documents`, `Desktop`, `Downloads`, `Pictures`, `Videos`, `OneDrive`, `Dropbox`, `iCloud`, and any synced cloud folder.
- `AppData` (`Local`, `LocalLow`, `Roaming`) — other than tooling caches strictly required for npm/node/git to function. Those caches are written by the tools themselves and must not be inspected by the AI.
- `C:\Windows\`, `C:\Program Files\`, `C:\Program Files (x86)\`, `C:\ProgramData\`.
- Browser profiles, mail clients, password managers, SSH keys (`~/.ssh`), GPG keys, cloud CLIs (`~/.aws`, `~/.azure`, `~/.gcloud`), global `.env*`, global git config.
- The Windows registry (`HKCU`, `HKLM`, `HKU`, `HKCR`).
- Every drive other than the workspace folder and `D:\`.

### Forbidden discovery commands

Do not run any of the following without explicit per-instance user permission, even if they appear harmless:

- `Get-ChildItem`, `dir`, `ls`, `Get-Item` outside the workspace or known tooling paths.
- `Get-AppxPackage`, `Get-Package`, `Get-WmiObject`, `Get-CimInstance`, broad `Get-Process` dumps.
- `where.exe` or `Get-Command` for binaries unrelated to the project. Project tooling (Node, npm, git, flyctl, vercel) is allowed.
- Registry queries (`reg query`, `Get-ItemProperty` on `HKCU:\…` or `HKLM:\…`).
- Network discovery (`netstat`, `arp`, `ipconfig /all`, `Get-NetAdapter`) beyond what is needed for local dev ports.
- Identity / system queries (`whoami`, `Get-LocalUser`, `Get-ComputerInfo`, `systeminfo`).

### Required behaviour

- Every file read or write must target a path inside the workspace folder.
- Every shell command must either run from inside the workspace (after `cd`) or invoke an executable from `D:\Node\` or `D:\Git\cmd\` by full path. Do not change directory to anywhere else.
- The only environment variables the agent may inspect are those required to run project tooling (for example, extending `PATH` to include `D:\Node` and `D:\Git\cmd`). Do not enumerate or dump environment variables wholesale.
- If diagnostic information from outside the boundary is genuinely needed (for example, checking whether a tool is installed system-wide), the agent must describe what it wants to run and ask the user to either authorise it or run it themselves.

## How violations are handled

If at any point the agent realises it is about to cross — or has just crossed — this boundary, it must:

1. Stop the offending action immediately.
2. Surface what it was about to do, and why.
3. Ask the user to either authorise the specific action, suggest a safer alternative, or abandon the step.

The agent must not silently work around this rule, and must not assume that previous user authorisations apply to new actions.
