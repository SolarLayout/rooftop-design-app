PVObject_=pvModule
  Version=6.79
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-420 BG
    DataSource=RETC-SFB035-220616
    Width=1.029
    Height=1.864
    Depth=0.035
    Weight=20.800
    NPieces=100
    PriceDate=19/05/22 03:49
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=66
  NCelP=1
  NDiode=3
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=420.0
  PNomTolLow=0.00
  PNomTolUp=2.40
  Isc=11.400
  Voc=46.36
  Imp=10.910
  Vmp=38.51
  muISC=4.93
  muVocSpec=-140.0
  muPmpReq=-0.345
  RShunt=600
  Rp_0=800
  Rp_Exp=5.00
  RSerie=0.211
  Gamma=0.999
  muGamma=-0.0005
  VMaxIEC=1000
  VMaxUL=1000
  Absorb=0.90
  ARev=3.200
  BRev=13.440
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=183.7
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
      Point_4=65.0,0.92000
      Point_5=70.0,0.87200
      Point_6=75.0,0.77100
      Point_7=80.0,0.62600
      Point_8=85.0,0.39300
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
