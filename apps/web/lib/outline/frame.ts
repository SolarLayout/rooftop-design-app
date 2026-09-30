// A flat frame in metres around a place on the map: x east, y north, for what is shown while the user
// draws. The document's metres come from the API's projection (decision D41); this frame differs from
// them by the scale of the projection (lengths within 0.05 m over 100 m) and by the convergence of the
// grid: the API's y is the grid north of its UTM zone, 0.36° from true north at Pune.
import type { XY } from "./measure";

export type LonLat = { lon: number; lat: number };

export type Frame = { centre: LonLat; metresPerDegreeLon: number; metresPerDegreeLat: number };

/** The frame whose (0, 0) is at `centre`. The metres of a degree are those of the WGS84 ellipsoid at its latitude. */
export function frameAt(centre: LonLat): Frame {
  const latitude = (centre.lat * Math.PI) / 180;
  return {
    centre,
    // The usual series for the ellipsoid: a sphere is 0.5 % out in latitude at Pune, 0.24 m on 40 m.
    metresPerDegreeLon: 111_412.84 * Math.cos(latitude) - 93.5 * Math.cos(3 * latitude) + 0.118 * Math.cos(5 * latitude),
    metresPerDegreeLat: 111_132.954 - 559.822 * Math.cos(2 * latitude) + 1.175 * Math.cos(4 * latitude),
  };
}

export function toMetres(frame: Frame, place: LonLat): XY {
  return {
    x: (place.lon - frame.centre.lon) * frame.metresPerDegreeLon,
    y: (place.lat - frame.centre.lat) * frame.metresPerDegreeLat,
  };
}

export function toLonLat(frame: Frame, point: XY): LonLat {
  return {
    lon: frame.centre.lon + point.x / frame.metresPerDegreeLon,
    lat: frame.centre.lat + point.y / frame.metresPerDegreeLat,
  };
}
