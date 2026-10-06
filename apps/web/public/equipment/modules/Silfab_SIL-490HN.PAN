PVObject_=pvModule
  Version=6.79
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-490HN
    DataSource=RETC-SFB025e-210414
    Width=1.037
    Height=2.263
    Depth=0.035
    Weight=25.800
    NPieces=100
    PriceDate=31/03/21 02:55
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=78
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  GRef=1000
  TRef=25.0
  PNom=490.0
  PNomTolLow=0.00
  PNomTolUp=2.74
  Isc=11.360
  Voc=53.96
  Imp=10.830
  Vmp=45.23
  muISC=6.50
  muVocSpec=-140.0
  muPmpReq=-0.377
  RShunt=800
  Rp_0=1550
  Rp_Exp=5.50
  RSerie=0.234
  Gamma=0.975
  muGamma=-0.0008
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=13.440
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=137.1
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
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,0.98100
      Point_5=70.0,0.90600
      Point_6=75.0,0.81800
      Point_7=80.0,0.66100
      Point_8=85.0,0.37100
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
