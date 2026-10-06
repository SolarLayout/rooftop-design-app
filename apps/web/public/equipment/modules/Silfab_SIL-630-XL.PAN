PVObject_=pvModule
  Version=8.0
  Flags=$00908043

  PVObject_Commercial=pvCommercial
    Comment=Silfab
    Flags=$0041
    Manufacturer=Silfab
    Model=SIL-630-XL
    DataSource=R9013E-1_Silfab
    Width=1.133
    Height=2.465
    Depth=0.035
    Weight=29.500
    NPieces=100
    PriceDate=30/09/24 11:21
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=78
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  GRef=1000
  TRef=25.0
  PNom=630.0
  PNomTolLow=0.00
  PNomTolUp=1.80
  BifacialityFactor=0.703
  Isc=13.660
  Voc=57.49
  Imp=13.000
  Vmp=48.47
  muISC=5.46
  muVocSpec=-139.1
  muPmpReq=-0.283
  RShunt=1400
  Rp_0=5500
  Rp_Exp=5.50
  RSerie=0.200
  Gamma=1.041
  muGamma=-0.0002
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=16.622
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellWidth=0.182
  CellHeight=0.092
  SandiaAMCorr=50.000

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$008D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,0.99900
      Point_3=50.0,0.98900
      Point_4=60.0,0.96600
      Point_5=70.0,0.89700
      Point_6=75.0,0.82110
      Point_7=80.0,0.68600
      Point_8=85.0,0.45100
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
