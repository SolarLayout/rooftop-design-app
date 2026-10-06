PVObject_=pvModule
  Version=6.64
  Flags=$00900043

  PVObject_Commercial=pvCommercial
    Comment=Silfab Solar
    Flags=$0041
    Manufacturer=Silfab
    Model=SLA X 360
    DataSource=Manufacturer
    Width=0.990
    Height=1.970
    Depth=0.068
    Weight=22.00
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
  PNom=360.0
  PNomTolLow=0.00
  PNomTolUp=1.40
  BifacialityFactor=0.800
  Isc=9.660
  Voc=47.50
  Imp=8.950
  Vmp=40.30
  muISC=3.86
  muVocSpec=-93.0
  muPmpReq=-0.399
  RShunt=475
  Rp_0=1900
  Rp_Exp=5.50
  RSerie=0.281
  Gamma=0.930
  muGamma=-0.0006
  VMaxIEC=1000
  VMaxUL=600
  Absorb=0.90
  ARev=3.200
  BRev=11.256
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellArea=245.7
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
      Point_2=10.0,1.00000
      Point_3=20.0,1.00000
      Point_4=30.0,1.00000
      Point_5=50.0,1.00000
      Point_6=60.0,0.99000
      Point_7=70.0,0.97000
      Point_8=80.0,0.77000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM
End of PVObject pvModule
