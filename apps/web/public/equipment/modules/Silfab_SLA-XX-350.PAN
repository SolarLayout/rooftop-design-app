PVObject_=pvModule
  Version=6.47
  Flags=$00100243

  PVObject_Commercial=pvCommercial
    Comment=Silfab Solar
    Flags=$0041
    Manufacturer=Silfab
    Model=SLA XX 350
    DataSource=Manufacturer
    Width=0.990
    Height=1.970
    Depth=0.068
    Weight=28.00
    NPieces=100
    PriceDate=13/11/16 20:34
    Currency=€
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=72
  NCelP=1
  NDiode=3
  GRef=1000
  TRef=25.0
  PNom=350.0
  PNomTolLow=0.00
  PNomTolUp=1.80
  Isc=9.400
  Voc=48.00
  Imp=8.900
  Vmp=39.60
  muISC=3.85
  muVocSpec=-93.0
  muPmpReq=-0.415
  RShunt=550
  Rp_0=8000
  Rp_Exp=22.00
  RSerie=0.343
  Gamma=0.939
  muGamma=-0.0007
  VMaxIEC=1000
  VMaxUL=600
  Absorb=0.90
  ARev=3.200
  BRev=11.256
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=243.7
  SandiaAMCorr=50.000

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$001D
      Mode=3
      Point_1=0.0,1.000
      Point_2=10.0,0.979
      Point_3=20.0,1.000
      Point_4=30.0,1.000
      Point_5=40.0,1.000
      Point_6=50.0,0.989
      Point_7=60.0,0.962
      Point_8=70.0,0.963
      Point_9=80.0,0.752
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
