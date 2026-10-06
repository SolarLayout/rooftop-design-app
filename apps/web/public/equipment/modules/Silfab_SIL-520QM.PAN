PVObject_=pvModule
  Version=6.79
  Flags=$00100042

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar Inc.
    Model=SIL-520QM
    DataSource=RETC-SFB039-230215
    Width=1.133
    Height=2.098
    Depth=0.035
    Weight=26.200
    NPieces=100
    PriceDate=15/02/23 02:52
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  FrontSurface=fsNormalGlass
  GRef=1000
  TRef=25.0
  PNom=520.0
  PNomTolLow=0.00
  PNomTolUp=2.00
  Isc=13.650
  Voc=47.52
  Imp=12.840
  Vmp=40.48
  muISC=5.53
  muVocSpec=-140.0
  muPmpReq=-0.295
  RShunt=2000
  Rp_0=2900
  Rp_Exp=7.50
  RSerie=0.136
  Gamma=1.097
  muGamma=-0.0002
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=-11998.800
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=165.1
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
      Point_3=50.0,0.98900
      Point_4=65.0,0.94200
      Point_5=70.0,0.89600
      Point_6=75.0,0.80400
      Point_7=80.0,0.67500
      Point_8=85.0,0.45100
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
