PVObject_=pvModule
  Version=7.2.4
  Flags=$00100343

  PVObject_Commercial=pvCommercial
    Comment=www.heliene.com
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=108HC-395 M10 SL Monofacial Black
    DataSource=TUV SUD
    YearBeg=2025
    Width=1.134
    Height=1.725
    Depth=0.035
    Weight=21.500
    NPieces=100
    PriceDate=23/04/21 13:40
    Remarks, Count=4
      Str_1=Frame: Aluminium
      Str_2=Structure: 3.2 mm glass - EVA -  backsheet
      Str_3=Connections: Cable,Connectors and Junction box
      Str_4
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=54
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=395.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  Isc=13.480
  Voc=37.38
  Imp=12.540
  Vmp=31.49
  muISC=6.74
  muVocSpec=-97.0
  muPmpReq=-0.349
  RShunt=240
  Rp_0=1650
  Rp_Exp=5.50
  RSerie=0.165
  Gamma=0.984
  muGamma=-0.0005
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
  RelEffic800=0.35
  RelEffic600=0.27
  RelEffic400=0.04
  RelEffic200=-1.58

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
      Point_3=50.0,0.98500
      Point_4=60.0,0.95900
      Point_5=70.0,0.86800
      Point_6=75.0,0.80300
      Point_7=80.0,0.69300
      Point_8=85.0,0.41600
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=7 tOperPoint
    Point_1=False,1000,25.0,0.00,0.00,0.000,0.000,0.00
    Point_2=False,100,25.0,-6.51,0.00,0.000,0.000,0.00
    Point_3=False,200,25.0,-1.58,0.00,0.000,0.000,0.00
    Point_4=False,400,25.0,0.04,0.00,0.000,0.000,0.00
    Point_5=False,600,25.0,0.27,0.00,0.000,0.000,0.00
    Point_6=False,800,25.0,0.35,0.00,0.000,0.000,0.00
    Point_7=False,1100,25.0,-0.33,0.00,0.000,0.000,0.00
  End of List OperPoints
End of PVObject pvModule
