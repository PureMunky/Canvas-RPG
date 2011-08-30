Public Class ItemBase

    '******************************************************'
    '* Class: ItemBase                                    *'
    '* Created: 1/19/2011                                 *'
    '* Created By: Phil                                   *'
    '******************************************************'

    Dim _Name As String
    Dim _Description As String
    Dim _Stack As Integer

    Public Sub New(ByVal inName As String, ByVal inDescription As String, ByVal inStack As Integer)
        FillData(inName, inDescription, inStack)
    End Sub

    Private Sub FillData(ByVal inName As String, ByVal inDescription As String, ByVal inStack As Integer)
        Name = inName
        Description = inDescription
        Stack = inStack
    End Sub
    Public Property Name() As String
        Get
            Return _Name
        End Get
        Set(ByVal value As String)
            _Name = value
        End Set
    End Property
    Public Property Description() As String
        Get
            Return _Description
        End Get
        Set(ByVal value As String)
            _Description = value
        End Set
    End Property
    Public Property Stack() As Integer
        Get
            Return _Stack
        End Get
        Set(ByVal value As Integer)
            _Stack = value
        End Set
    End Property

End Class