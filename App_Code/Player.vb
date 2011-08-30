<Serializable()> Public Class Player
    Inherits PlayerBase
    
    Public ReadOnly Property TimeStamp As Date
        Get
            Return Date.Now
        End Get
    End Property

    Dim _History(0) As PlayerHistory
    Public Property History As PlayerHistory()
        Get
            Return _History
        End Get
        Set(ByVal value As PlayerHistory())
            _History = value
        End Set
    End Property

    Public Sub New()
        MyBase.New()
    End Sub

    Public Sub New(ByVal inName As String, ByVal inEXP As Integer, ByVal inStrength As Integer, ByVal inSpeed As Integer, ByVal inDefense As Integer, ByVal inIntelligence As Integer, ByVal inMagic As Integer, ByVal inPlayTime As TimeSpan)
        MyBase.New(inName, inEXP, inStrength, inSpeed, inDefense, inIntelligence, inMagic, inPlayTime)
    End Sub

    Public Sub WriteToHistory()
        Dim i As Integer = Me.History.Length
        Dim r As Integer = 0
        If Me.History(i - 1) Is Nothing Then
            r = i - 1
        Else
            ReDim Preserve Me.History(i)
            r = i
        End If

        Me.History(r) = Me.ToHistory
    End Sub

#Region "Conversions"
    Public Function ToHistory() As PlayerHistory
        Return New PlayerHistory(Me.TimeStamp, Me.Name, Me.EXP, Me.Strength, Me.Speed, Me.Defense, Me.Intelligence, Me.Magic, Me.PlayTime)
    End Function
    Public Overrides Function ToString() As String
        Dim rtnStr As String = ""

        rtnStr &= "Name: " & Me.Name
        rtnStr &= "<br/>" & "EXP: " & Me.EXP
        rtnStr &= "<br/>" & "Str: " & Me.Strength
        rtnStr &= "<br/>" & "Spe: " & Me.Speed
        rtnStr &= "<br/>" & "Def: " & Me.Defense
        rtnStr &= "<br/>" & "Int: " & Me.Intelligence
        rtnStr &= "<br/>" & "Mag: " & Me.Magic

        rtnStr &= "<br/>History Length: " & Me.History.Length

        For i As Integer = 0 To Me.History.Length - 1
            If Me.History(i) IsNot Nothing Then
                rtnStr &= "<br/>" & i & ": " & Me.History(i).ToString
            End If
        Next

        Return rtnStr
    End Function

    Public Function ToXML() As String
        Dim rtnStr As String = "<?xml version=""1.0"" encoding=""utf-8"" ?>"
        rtnStr &= "<character>" & vbCrLf

        rtnStr &= vbTab & "<information>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<name>" & Me.Name & "</name>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<playtime>" & Me.PlayTime.TotalSeconds & "</playtime>" & vbCrLf
        rtnStr &= vbTab & "</information>" & vbCrLf

        rtnStr &= vbTab & "<stats>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<EXP>" & Me.EXP & "</EXP>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<Strength>" & Me.Strength & "</Strength>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<Speed>" & Me.Speed & "</Speed>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<Defense>" & Me.Defense & "</Defense>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<Intelligence>" & Me.Intelligence & "</Intelligence>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<Magic>" & Me.Magic & "</Magic>" & vbCrLf
        rtnStr &= vbTab & "</stats>" & vbCrLf

        rtnStr &= vbTab & "<inventory>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<item id=""1"" quantity=""1"">" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<add attr=""str"" value=""10"" />" & vbCrLf
        rtnStr &= vbTab & vbTab & "</item>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<item id=""2"" quantity=""1"" equip=""1"">" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<add special=""magic"" value=""1"" />" & vbCrLf
        rtnStr &= vbTab & vbTab & "</item>" & vbCrLf
        rtnStr &= vbTab & "</inventory>" & vbCrLf

        rtnStr &= vbTab & "<social>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<twitter>" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<username>@PureMunky</username>" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<password></password>" & vbCrLf
        rtnStr &= vbTab & vbTab & "</twitter>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<friends>" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<char name=""Fossil5"" desc=""Test"" />" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<char name=""Marstead"" desc=""Test"" />" & vbCrLf
        rtnStr &= vbTab & vbTab & vbTab & "<group name=""FWFS"" desc=""GroupTest"" />" & vbCrLf
        rtnStr &= vbTab & vbTab & "</friends>" & vbCrLf
        rtnStr &= vbTab & vbTab & "<group name=""FWFS"" active=""1"" joined=""1/3/2011 08:07:43"" />" & vbCrLf
        rtnStr &= vbTab & "</social>" & vbCrLf

        rtnStr &= vbTab & "<history>" & vbCrLf
        For i As Integer = 0 To Me.History.Length - 1
            If Me.History(i) IsNot Nothing Then
                rtnStr &= vbTab & vbTab & Me.History(i).ToXML()
            End If
        Next
        rtnStr &= vbTab & "</history>" & vbCrLf

        rtnStr &= "</character>"
        Return rtnStr
    End Function
#End Region

End Class
