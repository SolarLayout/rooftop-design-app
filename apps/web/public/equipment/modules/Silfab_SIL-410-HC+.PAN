PVObject_=pvModule
  Version=7.3
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar Inc.
    Model=SIL-410 HC+
    DataSource=RETC-SFB042e-230328
    Width=1.036
    Height=1.914
    Depth=0.035
    Weight=21.300
    NPieces=100
    PriceDate=17/03/23 06:07
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsNormalGlass
  GRef=1000
  TRef=25.0
  PNom=410.0
  PNomTolLow=0.00
  PNomTolUp=2.44
  Isc=11.150
  Voc=45.59
  Imp=10.520
  Vmp=38.99
  muISC=5.02
  muPmpReq=-0.321
  RShunt=600
  Rp_0=1350
  Rp_Exp=5.50
  RSerie=0.157
  Gamma=0.981
  muGamma=-0.0003
  VMaxIEC=1000
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=-11998.800
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
      Point_3=50.0,0.99100
      Point_4=65.0,0.95700
      Point_5=70.0,0.89400
      Point_6=75.0,0.83100
      Point_7=80.0,0.71900
      Point_8=85.0,0.44600
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
