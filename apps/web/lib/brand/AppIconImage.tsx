import { BRAND, MARK } from "./brand";

/** The mark drawn at a side, for `ImageResponse`: the ground with its corners or to the edges, the ridge over it. */
export function AppIconImage({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${MARK.box} ${MARK.box}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={MARK.box} height={MARK.box} rx={rounded ? MARK.corner : 0} fill={BRAND.ground} />
      <path d={MARK.path} fill="none" stroke={BRAND.mark} strokeWidth={MARK.stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
