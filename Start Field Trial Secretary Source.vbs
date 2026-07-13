Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appFolder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = appFolder
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File " & """" & appFolder & "\start_field_trial_secretary.ps1" & """"
shell.Run command, 0, False
