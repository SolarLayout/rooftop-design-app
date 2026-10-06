PVObject_=pvModule
  Version=7.4.8
  Flags=$00908043

  PVObject_Commercial=pvCommercial
    Comment=Heliene Inc
    Flags=$0041
    Manufacturer=Heliene Inc
    Model=132HC-610 G12R NTYP SL Bifacial
    DataSource=Heliene Inc 
    YearBeg=2026
    Width=1.134
    Height=2.382
    Depth=0.035
    Weight=30.51
    NPieces=100
    PriceDate=05/06/26 11:31
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=610.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.78
  Isc=15.700
  Voc=48.600
  Imp=14.850
  Vmp=41.100
  muISC=7.00
  muVocSpec=-122.0
  muPmpReq=-0.300
  RShunt=2000
  Rp_0=2300
  Rp_Exp=5.50
  RSerie=0.171
  Gamma=1.030
  muGamma=-0.0002
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=-11998.800
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellWidth=0.210
  CellHeight=0.09115
  SandiaAMCorr=50.000

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,0.99800
      Point_3=50.0,0.98600
      Point_4=60.0,0.96100
      Point_5=70.0,0.89100
      Point_6=75.0,0.81200
      Point_7=80.0,0.67400
      Point_8=85.0,0.43000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
