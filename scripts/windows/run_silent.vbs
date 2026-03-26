Set WshShell = CreateObject("WScript.Shell")

' Run the launcher bat relative to this script (no hard-coded user path)
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
launcher = Chr(34) & scriptDir & "\cointern-launch.bat" & Chr(34)

WshShell.Run launcher, 0, False
Set WshShell = Nothing

