PVObject_=pvModule
  Version=7.4
  Flags=$00100143

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar Inc.
    Model=SIL-430QD
    DataSource=RETC-SFB045e-230830
    Width=1.133
    Height=1.721
    Depth=0.035
    Weight=21.000
    NPieces=100
    PriceDate=01/08/23 02:26
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=54
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsNormalGlass
  GRef=1000
  TRef=25.0
  PNom=430.0
  PNomTolLow=0.00
  PNomTolUp=2.33
  BifacialityFactor=0.000
  Isc=13.870
  Voc=38.91
  Imp=12.930
  Vmp=33.25
  muISC=5.60
  muPmpReq=-0.295
  RShunt=800
  Rp_0=2900
  Rp_Exp=7.20
  RSerie=0.126
  Gamma=1.063
  muGamma=-0.0002
  VMaxIEC=1000
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=-11998.800
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
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
      Point_2=30.0,0.99300
      Point_3=50.0,0.97800
      Point_4=65.0,0.90800
      Point_5=70.0,0.85700
      Point_6=75.0,0.75400
      Point_7=80.0,0.60400
      Point_8=85.0,0.40800
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
