"""rooftop_core: the rooftop PV design engine.

Empty in phase 1; the engine is copied in during phase 2.

Rules that hold for everything in this package:

* It never imports a web or API framework (fastapi, starlette, uvicorn), `rooftop_api`, or any UI code.
  import-linter enforces this; the engine must run headless.
* Geometry is in local roof metres: x east, y north, z up. WGS84 appears only at the edges.
* System voltage has no default and is never chosen for the user.
"""
