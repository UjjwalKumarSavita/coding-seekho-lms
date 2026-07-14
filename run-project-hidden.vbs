Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run """" & root & "\run-backend-local.cmd" & """", 0, False
shell.Run """" & root & "\run-frontend-local.cmd" & """", 0, False
