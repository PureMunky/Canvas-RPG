Imports System.IO
Imports System.Xml

Public Class PlayerHandler

    Public Class SimulationSettings
        Enum SimulationLevel
            None = 0
            Low = 1
            Medium = 2
            High = 3
        End Enum

        Dim _Aggressiveness As SimulationLevel
        Public Property Aggressiveness As SimulationLevel
            Get
                If _Aggressiveness = Nothing Then
                    _Aggressiveness = SimulationLevel.None
                End If

                Return _Aggressiveness
            End Get
            Set(ByVal value As SimulationLevel)
                _Aggressiveness = value
            End Set
        End Property

        Public Sub New()
            Me.Aggressiveness = SimulationLevel.None
        End Sub
    End Class
    Public Shared Function CreatePlayer(ByVal inName As String, ByVal inEXP As Integer, ByVal inStrength As Integer, ByVal inSpeed As Integer, ByVal inDefense As Integer, ByVal inIntelligence As Integer, ByVal inMagic As Integer) As Player
        Dim p As New Player(inName, inEXP, inStrength, inSpeed, inDefense, inIntelligence, inMagic, New TimeSpan(0))

        Return p
    End Function

    Public Shared Function LoadPlayer(ByVal PlayerName As String) As Player
        Dim p As New Player()

        Dim xdoc As New XmlDocument()
        xdoc.LoadXml(FileAccess.LoadPlayerCharacterFile(PlayerName))

        With xdoc.Item("character")
            With .Item("information")
                p.Name = .Item("name").InnerText
                p.PlayTime = New TimeSpan(0, 0, .Item("playtime").InnerText)
            End With

            With .Item("stats")
                p.EXP = .Item("EXP").InnerText
                p.Strength = .Item("Strength").InnerText
                p.Speed = .Item("Speed").InnerText
                p.Defense = .Item("Defense").InnerText
                p.Intelligence = .Item("Intelligence").InnerText
                p.Magic = .Item("Magic").InnerText
            End With

            With .Item("inventory")

            End With

            With .Item("social")

            End With
        End With

        Return p
    End Function

    Public Shared Sub SavePlayer(ByVal inPlayer As Player)
        FileAccess.SavePlayerCharacterFile(inPlayer.Name, inPlayer.ToXML)
    End Sub

    Public Function GetPlayerAt(ByVal inPlayer As Player, ByVal inAtDate As Date, ByVal inSettings As SimulationSettings) As Player
        Dim rtnPlayer As Player = inPlayer
        Dim simSettings As SimulationSettings = inSettings
        If simSettings Is Nothing Then
            simSettings = New SimulationSettings
        End If

        If inPlayer.TimeStamp > inAtDate Then
            rtnPlayer = SlicePlayerAt(inPlayer, inAtDate)
        Else
            rtnPlayer = SimulatePlayerUntil(inPlayer, inAtDate, simSettings)
        End If

        Return rtnPlayer
    End Function

    Public Function SimulatePlayerUntil(ByVal inPlayer As Player, ByVal inUntilDate As Date, ByVal inSettings As SimulationSettings) As Player
        Dim rtnPlayer As Player = inPlayer

        Return rtnPlayer
    End Function

    Public Function SlicePlayerAt(ByVal inPlayer As Player, ByVal inAtDate As Date) As Player
        Dim rtnPlayer As Player = inPlayer

        Return rtnPlayer
    End Function
End Class
