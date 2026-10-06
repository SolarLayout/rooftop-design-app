PVObject_=pvModule
  Version=6.79
  Flags=$00900043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar Inc.
    Model=SIL-570XM+
    DataSource=SFB039-230215
    Width=1.133
    Height=2.278
    Depth=0.035
    Weight=28.500
    NPieces=100
    PriceDate=15/02/23 02:52
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=72
  NCelP=2
  NDiode=3
  FrontSurface=fsNormalGlass
  GRef=1000
  TRef=25.0
  PNom=570.0
  PNomTolLow=0.00
  PNomTolUp=1.80
  BifacialityFactor=0.800
  Isc=13.790
  Voc=52.03
  Imp=13.030
  Vmp=43.74
  muISC=5.52
  muVocSpec=-140.0
  muPmpReq=-0.294
  RShunt=2000
  Rp_0=4200
  Rp_Exp=7.50
  RSerie=0.160
  Gamma=1.147
  muGamma=-0.0001
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
