Imports System.IO
Imports System.Xml

Public Class FileAccess
    Private Shared RootPath As String = ConfigurationManager.AppSettings("RootPath") '"C:\Data\Data\J913680\My Projects - Work\Playground\Playground\"

    Private Shared PlayerPath As String = "XML\Players\"
    Private Shared PlayerCharacterFile As String = "character.xml"

    Private Shared Function getPlayerCharacterPath(ByVal PlayerName As String, Optional ByVal withFileName As Boolean = True) As String
        Dim rtnStr As String = ""

        rtnStr = RootPath & PlayerPath & PlayerName & "\"

        If withFileName Then
            rtnStr &= PlayerCharacterFile
        End If

        Return rtnStr
    End Function

    Public Shared Sub SavePlayerCharacterFile(ByVal PlayerName As String, ByVal newXML As String)
        Dim path As String = getPlayerCharacterPath(PlayerName, False)

        If Not Directory.Exists(path) Then
            Directory.CreateDirectory(path)
        End If

        Dim sw As New StreamWriter(getPlayerCharacterPath(PlayerName, True))
        sw.Write(newXML)
        sw.Close()
    End Sub
    Public Shared Function LoadPlayerCharacterFile(ByVal PlayerName As String) As String
        Dim rtnStr As String = ""

        Dim sr As New StreamReader(getPlayerCharacterPath(PlayerName, True))
        rtnStr = sr.ReadToEnd

        Return rtnStr
    End Function
End Class
