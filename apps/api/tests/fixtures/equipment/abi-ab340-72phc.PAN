PVObject_=pvModule
  Version=6.79
  Flags=$00100043

  PVObject_Commercial=pvCommercial
    Comment=www.abi-solar.com
    Flags=$0041
    Manufacturer=ABi Solar INC
    Model=AB340-72PHC PL01
    DataSource=Manufacturer 2017
    YearBeg=2017
    Width=0.992
    Height=1.986
    Depth=0.040
    Diameter=22.200
    NPieces=0
    PriceDate=12/10/17 20:52
    Currency=EUR
    Remarks, Count=5
      Str_1=Frame: aluminium
      Str_2=Structure:
      Str_3=Connections:
      Str_4
      Str_5
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiPoly
  NCelS=72
  NCelP=2
  NDiode=3
  GRef=1000
  TRef=25.0
  PNom=340.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  Isc=9.470
  Voc=45.86
  Imp=9.030
  Vmp=37.64
  muISC=4.74
  muVocSpec=-131.0
  muPmpReq=-0.408
  RShunt=800
  Rp_0=2000
  Rp_Exp=5.50
  RSerie=0.315
  Gamma=0.915
  muGamma=-0.0004
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=11.424
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=121.7
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
      Point_2=20.0,1.00000
      Point_3=30.0,1.00000
      Point_4=40.0,1.00000
      Point_5=50.0,1.00000
      Point_6=60.0,0.99000
      Point_7=70.0,0.93000
      Point_8=80.0,0.74000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
