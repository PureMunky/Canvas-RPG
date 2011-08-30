Public Class PlayerBase

    '******************************************************'
    '* Class: PlayerBase                                  *'
    '* Created: 1/19/2011                                 *'
    '* Created By: Phil                                   *'
    '******************************************************'

    Dim _Name As String
    Dim _EXP As Integer
    Dim _Strength As Integer
    Dim _Speed As Integer
    Dim _Defense As Integer
    Dim _Intelligence As Integer
    Dim _Magic As Integer
    Dim _PlayTime As TimeSpan

    Public Sub New()

    End Sub

    Public Sub New(ByVal inName As String, ByVal inEXP As Integer, ByVal inStrength As Integer, ByVal inSpeed As Integer, ByVal inDefense As Integer, ByVal inIntelligence As Integer, ByVal inMagic As Integer, ByVal inPlayTime As TimeSpan)
        FillData(inName, inEXP, inStrength, inSpeed, inDefense, inIntelligence, inMagic, inPlayTime)
    End Sub

    Private Sub FillData(ByVal inName As String, ByVal inEXP As Integer, ByVal inStrength As Integer, ByVal inSpeed As Integer, ByVal inDefense As Integer, ByVal inIntelligence As Integer, ByVal inMagic As Integer, ByVal inPlayTime As TimeSpan)
        Name = inName
        EXP = inEXP
        Strength = inStrength
        Speed = inSpeed
        Defense = inDefense
        Intelligence = inIntelligence
        Magic = inMagic
        PlayTime = inPlayTime
    End Sub
    Public Property Name() As String
        Get
            Return _Name
        End Get
        Set(ByVal value As String)
            _Name = value
        End Set
    End Property
    Public Property EXP() As Integer
        Get
            Return _EXP
        End Get
        Set(ByVal value As Integer)
            _EXP = value
        End Set
    End Property
    Public Property Strength() As Integer
        Get
            Return _Strength
        End Get
        Set(ByVal value As Integer)
            _Strength = value
        End Set
    End Property
    Public Property Speed() As Integer
        Get
            Return _Speed
        End Get
        Set(ByVal value As Integer)
            _Speed = value
        End Set
    End Property
    Public Property Defense() As Integer
        Get
            Return _Defense
        End Get
        Set(ByVal value As Integer)
            _Defense = value
        End Set
    End Property
    Public Property Intelligence() As Integer
        Get
            Return _Intelligence
        End Get
        Set(ByVal value As Integer)
            _Intelligence = value
        End Set
    End Property
    Public Property Magic() As Integer
        Get
            Return _Magic
        End Get
        Set(ByVal value As Integer)
            _Magic = value
        End Set
    End Property
    Public Property PlayTime As TimeSpan
        Get
            Return _PlayTime
        End Get
        Set(ByVal value As TimeSpan)
            _PlayTime = value
        End Set
    End Property

End Class