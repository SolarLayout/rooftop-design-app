PVObject_=pvModule
  Version=6.79
  Flags=$00100243

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-500HM
    DataSource=RETC-SFB025e-210414
    Width=1.133
    Height=2.098
    Depth=0.035
    Weight=26.200
    NPieces=100
    PriceDate=31/03/21 02:55
    Currency=EUR
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=2
  NDiode=3
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=500.0
  PNomTolLow=0.00
  PNomTolUp=2.00
  Isc=13.480
  Voc=45.78
  Imp=12.890
  Vmp=38.80
  muISC=6.50
  muVocSpec=-140.0
  muPmpReq=-0.340
  RShunt=1350
  Rp_0=2200
  Rp_Exp=5.50
  RSerie=0.132
  Gamma=0.982
  muGamma=-0.0005
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=13.440
  RDiode=0.010
  VRevDiode=-0.70
  IMaxDiode=50.0
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
      Point_3=50.0,0.98800
      Point_4=60.0,0.95000
      Point_5=70.0,0.87200
      Point_6=75.0,0.77100
      Point_7=80.0,0.62600
      Point_8=85.0,0.39200
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
