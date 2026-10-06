PVObject_=pvModule
  Version=7.4
  Flags=$00100143

  PVObject_Commercial=pvCommercial
    Comment=www.heliene.com
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=108HC-420 M10 NTYP SL All Black Module
    DataSource=Manufacturer
    YearBeg=2023
    Width=1.134
    Height=1.722
    Depth=0.035
    Weight=21.500
    NPieces=100
    PriceDate=23/04/21 13:40
    Remarks, Count=3
      Str_1=Module Construction: Framed Glass–Backsheet
      Str_2
      Str_3
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
  PNom=420.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.000
  Isc=13.980
  Voc=38.16
  Imp=13.180
  Vmp=31.92
  muISC=7.33
  muVocSpec=-138.0
  muPmpReq=-0.310
  RShunt=280
  Rp_0=1100
  Rp_Exp=5.50
  RSerie=0.156
  Gamma=1.003
  muGamma=-0.0003
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=10.860
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  SandiaAMCorr=50.000
  RelEffic800=0.28
  RelEffic600=0.21
  RelEffic400=0.06
  RelEffic200=-1.60

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
      Point_6=75.0,0.92000
      Point_7=80.0,0.85000
      Point_8=85.0,0.70000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=7 tOperPoint
    Point_1=True,1000,25.0,0.00,38.16,13.980,13.180,31.92,420.71
    Point_2=False,100,25.0,-6.41,0.00,0.000,0.000,0.00,39.87
    Point_3=False,200,25.0,-1.60,0.00,0.000,0.000,0.00,83.84
    Point_4=False,400,25.0,0.06,0.00,0.000,0.000,0.00,170.51
    Point_5=False,600,25.0,0.21,0.00,0.000,0.000,0.00,256.14
    Point_6=False,800,25.0,0.28,0.00,0.000,0.000,0.00,341.76
    Point_7=False,1100,25.0,-0.26,0.00,0.000,0.000,0.00,467.39
  End of List OperPoints
End of PVObject pvModule
