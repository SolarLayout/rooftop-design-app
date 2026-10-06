PVObject_=pvModule
  Version=6.79
  Flags=$00100343

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab Solar
    Model=SIL-370HC
    DataSource=RETC-SFB026e-210331
    Width=1.037
    Height=1.762
    Depth=0.035
    Weight=19.500
    NPieces=100
    PriceDate=31/03/21 02:55
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=60
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  GRef=1000
  TRef=25.0
  PNom=370.0
  PNomTolLow=0.00
  PNomTolUp=2.74
  Isc=11.250
  Voc=41.75
  Imp=10.600
  Vmp=34.95
  muISC=4.50
  muVocSpec=-140.0
  muPmpReq=-0.330
  RShunt=250
  Rp_0=970
  Rp_Exp=7.50
  RSerie=0.193
  Gamma=1.003
  muGamma=-0.0003
  VMaxIEC=1000
  VMaxUL=1000
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
