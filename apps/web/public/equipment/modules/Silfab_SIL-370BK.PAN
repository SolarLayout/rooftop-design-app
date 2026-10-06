PVObject_=pvModule
  Version=6.79
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-370BK
    DataSource=RETC-SFB025e-210414
    Width=0.990
    Height=1.795
    Depth=0.038
    Weight=19.000
    NPieces=100
    PriceDate=03/04/21 20:18
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=1
  NDiode=3
  GRef=1000
  TRef=25.0
  PNom=370.0
  PNomTolLow=0.00
  PNomTolUp=2.70
  Isc=10.330
  Voc=44.76
  Imp=9.670
  Vmp=38.33
  muISC=4.24
  muVocSpec=-140.0
  muPmpReq=-0.348
  RShunt=5500
  Rp_0=3000
  Rp_Exp=7.00
  RSerie=0.203
  Gamma=0.956
  muGamma=-0.0003
  VMaxIEC=1000
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=12.204
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
      Point_3=50.0,0.99000
      Point_4=65.0,0.93800
      Point_5=70.0,0.88900
      Point_6=75.0,0.81900
      Point_7=80.0,0.69000
      Point_8=85.0,0.41500
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
