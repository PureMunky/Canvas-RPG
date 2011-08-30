<Serializable()> Public Class PlayerHistory
    Inherits PlayerBase

    Dim _TimeStamp As Date
    Public Property TimeStamp As Date
        Get
            Return _TimeStamp
        End Get
        Set(ByVal value As Date)
            _TimeStamp = value
        End Set
    End Property

    Public Sub New(ByVal inTimeStamp As Date, ByVal inName As String, ByVal inEXP As Integer, ByVal inStrength As Integer, ByVal inSpeed As Integer, ByVal inDefense As Integer, ByVal inIntelligence As Integer, ByVal inMagic As Integer, ByVal inPlayTime As TimeSpan)
        MyBase.New(inName, inEXP, inStrength, inSpeed, inDefense, inIntelligence, inMagic, inPlayTime)
        FillData(inTimeStamp)
    End Sub
    Public Sub New(ByVal inTimeStamp As Date, ByVal inPlayer As Player)
        MyBase.New(inPlayer.Name, inPlayer.EXP, inPlayer.Strength, inPlayer.Speed, inPlayer.Defense, inPlayer.Intelligence, inPlayer.Magic, inPlayer.PlayTime)
        FillData(inTimeStamp)
    End Sub

    Private Sub FillData(ByVal inTimeStamp As Date)
        Me.TimeStamp = inTimeStamp
    End Sub

    Public Overrides Function ToString() As String
        Return Me.TimeStamp & " " & Me.Name
    End Function

    Public Function ToXML() As String
        Dim rtnStr As String = ""
        rtnStr &= "<historySave>"
        rtnStr &= "<timeStamp>" & Me.TimeStamp & "</timeStamp>"
        rtnStr &= "<name>" & Me.Name & "</name>"
        rtnStr &= "</historySave>"
        Return rtnSTr
    End Function
End Class
