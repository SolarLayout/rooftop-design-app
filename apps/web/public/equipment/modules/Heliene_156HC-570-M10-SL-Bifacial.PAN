PVObject_=pvModule
  Version=7.4
  Flags=$00900143

  PVObject_Commercial=pvCommercial
    Comment=www.heliene.com
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=156HC-570 M10 SL Bifacial
    DataSource=TUV SUD
    YearBeg=2023
    Width=1.134
    Height=2.464
    Depth=0.035
    Weight=31.000
    NPieces=100
    PriceDate=23/04/21 13:40
    Remarks, Count=5
      Str_1=Frame: Aluminium
      Str_2=Structure: 3.2 mm glass - EVA -  backsheet
      Str_3=Connections: Cable,Connectors and Junction box
      Str_4
      Str_5
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=78
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=570.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.700
  Isc=13.440
  Voc=53.59
  Imp=12.580
  Vmp=45.23
  muISC=7.02
  muVocSpec=-137.0
  muPmpReq=-0.338
  RShunt=500
  Rp_0=2000
  Rp_Exp=5.50
  RSerie=0.220
  Gamma=0.978
  muGamma=-0.0004
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=10.860
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  SandiaAMCorr=50.000
  RelEffic800=0.34
  RelEffic600=0.12
  RelEffic200=-1.56

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,1.00000
      Point_5=70.0,0.95000
      Point_6=75.0,0.91000
      Point_7=80.0,0.85000
      Point_8=85.0,0.71000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=13 tOperPoint
    Point_1=True,1000,25.0,0.00,53.59,13.440,12.580,45.23,568.99
    Point_2=False,100,15.0,-6.51,0.00,0.000,0.000,0.00,55.53
    Point_3=False,200,15.0,-1.70,0.00,0.000,0.000,0.00,116.78
    Point_4=False,400,15.0,0.10,0.00,0.000,0.000,0.00,237.83
    Point_5=False,600,15.0,0.21,0.00,0.000,0.000,0.00,357.14
    Point_6=False,800,15.0,0.33,0.00,0.000,0.000,0.00,476.76
    Point_7=False,100,25.0,-5.82,0.00,0.000,0.000,0.00,54.16
    Point_8=False,200,25.0,-1.56,0.00,0.000,0.000,0.00,113.22
    Point_9=False,400,25.0,0.00,0.00,0.000,0.000,0.00,230.03
    Point_10=False,600,25.0,0.12,0.00,0.000,0.000,0.00,345.46
    Point_11=False,800,25.0,0.34,0.00,0.000,0.000,0.00,461.63
    Point_12=False,1100,25.0,-0.13,0.00,0.000,0.000,0.00,631.77
    Point_13=False,1000,15.0,0.00,0.00,0.000,0.000,0.00,605.25
  End of List OperPoints
End of PVObject pvModule
