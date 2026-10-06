PVObject_=pvModule
  Version=6.79
  Flags=$00100243

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-360NX
    DataSource=RETC-SFB027e-210408
    Width=1.000
    Height=1.832
    Depth=0.038
    Weight=19.600
    NPieces=100
    PriceDate=21/03/21 03:44
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=1
  NDiode=3
  GRef=1000
  TRef=25.0
  PNom=360.0
  PNomTolLow=0.00
  PNomTolUp=2.74
  Isc=10.200
  Voc=45.40
  Imp=9.700
  Vmp=37.11
  muISC=3.88
  muVocSpec=-140.0
  muPmpReq=-0.354
  RShunt=425
  Rp_0=1470
  Rp_Exp=7.50
  RSerie=0.297
  Gamma=0.997
  muGamma=-0.0004
  VMaxIEC=1000
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=12.660
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=251.9
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
