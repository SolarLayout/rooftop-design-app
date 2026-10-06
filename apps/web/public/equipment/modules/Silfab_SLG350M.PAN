PVObject_=pvModule
  Version=6.64
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Flags=$0041
    Manufacturer=Silfab
    Model=SLG350M
    DataSource=Callab PV Modules
    Width=0.990
    Height=1.970
    NPieces=100
    PriceDate=23/01/17 10:48
    Currency=EUR
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=72
  NCelP=1
  NDiode=1
  GRef=1000
  TRef=25.0
  PNom=350.0
  PNomTolLow=0.00
  PNomTolUp=1.40
  Isc=9.610
  Voc=47.50
  Imp=9.020
  Vmp=38.90
  muISC=4.00
  muVocSpec=-80.0
  muPmpReq=-0.390
  RShunt=400
  Rp_0=2000
  Rp_Exp=9.30
  RSerie=0.376
  Gamma=0.952
  muGamma=-0.0003
  Absorb=0.90
  ARev=3.200
  BRev=11.508
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  SandiaAMCorr=50.000
  RelEffic800=18.06
  RelEffic700=18.08
  RelEffic600=18.06
  RelEffic400=17.91
  RelEffic200=17.50

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=8
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,0.99000
      Point_5=70.0,0.95000
      Point_6=80.0,0.77000
      Point_7=85.0,0.47600
      Point_8=90.0,0.00000
      Point_9=0.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
