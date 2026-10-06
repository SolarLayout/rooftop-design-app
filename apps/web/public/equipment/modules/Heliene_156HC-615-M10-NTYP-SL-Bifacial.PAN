PVObject_=pvModule
  Version=7.2.4
  Flags=$00900043

  PVObject_Commercial=pvCommercial
    Comment=www.heliene.com
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=156HC-615 M10 NTYP SL Bifacial
    DataSource=TUV SUD
    YearBeg=2026
    Width=1.134
    Height=2.464
    Depth=0.035
    Weight=31.000
    NPieces=100
    PriceDate=23/04/21 13:40
    Remarks, Count=3
      Str_1=Module Construction: Framed Glass–Backsheet
      Str_2
      Str_3
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
  PNom=615.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.780
  Isc=13.640
  Voc=56.92
  Imp=12.880
  Vmp=47.75
  muISC=7.25
  muVocSpec=-138.0
  muPmpReq=-0.310
  RShunt=400
  Rp_0=12000
  Rp_Exp=4.00
  RSerie=0.208
  Gamma=1.063
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
      Point_2=30.0,0.99500
      Point_3=50.0,0.98100
      Point_4=60.0,0.96300
      Point_5=70.0,0.87700
      Point_6=75.0,0.80700
      Point_7=80.0,0.69400
      Point_8=85.0,0.42000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=7 tOperPoint
    Point_1=False,1000,25.0,0.00,0.00,0.000,0.000,0.00
    Point_2=False,100,25.0,-6.41,0.00,0.000,0.000,0.00
    Point_3=False,200,25.0,-1.60,0.00,0.000,0.000,0.00
    Point_4=False,400,25.0,0.06,0.00,0.000,0.000,0.00
    Point_5=False,600,25.0,0.21,0.00,0.000,0.000,0.00
    Point_6=False,800,25.0,0.28,0.00,0.000,0.000,0.00
    Point_7=False,1100,25.0,-0.26,0.00,0.000,0.000,0.00
  End of List OperPoints
End of PVObject pvModule
