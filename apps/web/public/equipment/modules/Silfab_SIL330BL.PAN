PVObject_=pvModule
  Version=6.79
  Flags=$00100243

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar Inc.
    Model=SIL330BL
    DataSource=RETC-SFB022-191003
    Width=1.000
    Height=1.700
    Depth=0.038
    Weight=19.500
    NPieces=100
    PriceDate=03/10/19 00:58
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=63
  NCelP=2
  NDiode=3
  GRef=1000
  TRef=25.0
  PNom=330.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  Isc=9.980
  Voc=42.10
  Imp=9.650
  Vmp=34.20
  muISC=4.59
  muVocSpec=-140.0
  muPmpReq=-0.377
  RShunt=1000
  Rp_0=1600
  Rp_Exp=5.30
  RSerie=0.245
  Gamma=0.973
  muGamma=-0.0005
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=11.904
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=122.3
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
      Point_4=65.0,0.95300
      Point_5=70.0,0.90600
      Point_6=75.0,0.81800
      Point_7=80.0,0.66100
      Point_8=85.0,0.37100
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
