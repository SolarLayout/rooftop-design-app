"""rooftop_core: the rooftop PV design engine.

Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67; every copied module names
its source in its first line. There is no import from, or path to, the old repository.

Rules that hold for everything in this package:

* It never imports a web or API framework (fastapi, starlette, uvicorn), `rooftop_api`, PyQt5 or any UI
  code. import-linter enforces this; the engine must run headless.
* Geometry is in local roof metres: x east, y north, z up. WGS84 appears only at the edges.
* The engine has no default system voltage: a project without one is not sized, and says so. The web app
  sets a new design's voltage from the user's country and keeps who set it (D87).
"""
