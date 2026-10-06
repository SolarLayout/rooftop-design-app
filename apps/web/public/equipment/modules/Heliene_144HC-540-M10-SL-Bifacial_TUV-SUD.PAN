PVObject_=pvModule
  Version=7.2.4
  Flags=$00900043

  PVObject_Commercial=pvCommercial
    Comment=Heliene Inc
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=144HC-540 M10 SL Bifacial
    DataSource=TUV SUD
    YearBeg=2026
    Width=1.134
    Height=2.279
    Depth=0.040
    Weight=29.200
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
  NCelS=72
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=540.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.700
  Isc=13.500
  Voc=50.22
  Imp=12.770
  Vmp=42.32
  muISC=4.59
  muVocSpec=-140.0
  muPmpReq=-0.367
  RShunt=300
  Rp_0=6000
  Rp_Exp=5.50
  RSerie=0.175
  Gamma=0.983
  muGamma=-0.0006
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=10.860
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=165.1
  SandiaAMCorr=50.000
  RelEffic800=0.14
  RelEffic600=0.18
  RelEffic400=0.02
  RelEffic200=-2.31

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,0.99500
      Point_3=50.0,0.97900
      Point_4=60.0,0.96000
      Point_5=70.0,0.88300
      Point_6=75.0,0.80900
      Point_7=80.0,0.68700
      Point_8=85.0,0.41800
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=7 tOperPoint
    Point_1=False,1000,25.0,0.00,0.00,0.000,0.000,0.00
    Point_2=False,100,25.0,-5.20,0.00,0.000,0.000,0.00
    Point_3=False,200,25.0,-2.31,0.00,0.000,0.000,0.00
    Point_4=False,400,25.0,0.02,0.00,0.000,0.000,0.00
    Point_5=False,600,25.0,0.18,0.00,0.000,0.000,0.00
    Point_6=False,800,25.0,0.14,0.00,0.000,0.000,0.00
    Point_7=False,1100,25.0,-0.54,0.00,0.000,0.000,0.00
  End of List OperPoints
End of PVObject pvModule
