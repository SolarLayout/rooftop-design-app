PVObject_=pvModule
  Version=8.0.9
  Flags=$00908243

  PVObject_Commercial=pvCommercial
    Comment=Emmvee Energy Private Limited
    Flags=$0041
    Manufacturer=Emmvee Energy Private Limited
    Model=E620HCBG132-T
    DataSource=TUV Rheinland India Pvt Ltd
    YearBeg=2025
    Width=1.134
    Height=2.382
    Depth=0.035
    Weight=34.000
    NPieces=100
    PriceDate=19/06/25 16:45
    Remarks, Count=6
      Str_1=Frame: Cell: TOPCon - G12R
      Str_2=Structure: anodized alu.
      Str_3=Connections: Junction Box: JA Solar
      Str_4
      Str_5
      Str_6
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=620.0
  PNomTolLow=-3.00
  PNomTolUp=3.00
  BifacialityFactor=0.780
  Isc=16.040
  Voc=49.14
  Imp=15.190
  Vmp=40.82
  muISC=5.20
  muVocSpec=-110.1
  muPmpReq=-0.289
  RShunt=926
  Rp_0=9800
  Rp_Exp=5.50
  RSerie=0.178
  Gamma=1.109
  muGamma=-0.0002
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=16.310
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  LIDLoss=0.20
  SandiaAMCorr=50.000
  RelEffic800=0.68
  RelEffic600=0.88
  RelEffic400=0.20
  RelEffic200=-1.35

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$008D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,0.98000
      Point_5=70.0,0.92000
      Point_6=75.0,0.86000
      Point_7=80.0,0.76000
      Point_8=85.0,0.59000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=23 tOperPoint
    Point_1=True,1100,25.0,-0.31,48.79,17.620,16.690,40.81,681.12
    Point_2=True,1000,25.0,0.00,48.65,16.010,15.230,40.78,621.08
    Point_3=True,800,25.0,0.68,48.31,12.820,12.240,40.87,500.25
    Point_4=True,600,25.0,0.88,47.85,9.630,9.160,41.04,375.93
    Point_5=True,400,25.0,0.20,47.13,6.400,6.100,40.81,248.94
    Point_6=True,200,25.0,-1.35,45.78,3.210,3.050,40.18,122.55
    Point_7=True,100,25.0,-3.87,44.79,1.620,1.520,39.28,59.71
    Point_8=True,1000,15.0,0.00,49.74,15.950,15.180,42.09,638.93
    Point_9=True,800,15.0,0.60,49.40,12.770,12.190,42.17,514.05
    Point_10=True,600,15.0,0.86,48.96,9.590,9.140,42.29,386.53
    Point_11=True,500,15.0,0.78,48.65,8.000,7.640,42.13,321.87
    Point_12=True,400,15.0,0.16,48.25,6.380,6.080,42.09,255.91
    Point_13=True,200,15.0,-1.41,46.93,3.200,3.040,41.43,125.95
    Point_14=True,100,15.0,-3.01,45.43,1.610,1.530,40.49,61.95
    Point_15=True,1100,50.0,-0.25,46.04,17.780,16.750,37.74,632.15
    Point_16=True,1000,50.0,0.00,45.89,16.170,15.230,37.85,576.46
    Point_17=True,800,50.0,0.78,45.52,12.950,12.250,37.92,464.52
    Point_18=True,600,50.0,1.18,45.09,9.720,9.190,38.06,349.77
    Point_19=True,400,50.0,0.24,44.48,6.470,6.100,37.87,231.01
    Point_20=True,1100,75.0,-0.14,43.30,17.970,16.790,34.68,582.28
    Point_21=True,1000,75.0,0.00,43.14,16.350,15.320,34.68,531.30
    Point_22=True,800,75.0,1.09,42.77,13.090,12.270,34.94,428.71
    Point_23=True,600,75.0,1.42,42.29,9.820,9.230,34.95,322.59
  End of List OperPoints
End of PVObject pvModule
