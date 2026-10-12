import type { CosmeticId } from '../progression';

type Glyph = CosmeticId | 'person' | 'pigeon' | 'coffee' | 'case' | 'medal';
const paths: Record<Glyph, string> = {
  cone: 'M7 2h2v3h1v3h1v3h2v2H3v-2h2V8h1V5h1z',
  halo: 'M4 2h8v1h2v3h-2v1H4V6H2V3h2zm0 2v1h8V4zM5 9h6v4H5z',
  crown: 'M2 4h2v2h2V4h1V2h2v2h1v2h2V4h2v8H2zm1 9h10v1H3z',
  bucket: 'M3 3h10v2H3zm1 3h8v7H4zm2 1v4h1V7z',
  headphones: 'M5 2h6v1h2v2h1v7h-4V7h2V5h-1V4H5v1H4v2h2v5H2V5h1V3h2z',
  antenna: 'M7 6h2v5h4v2H3v-2h4zM2 2h2v2H2zm2 2h2v2H4zm8-2h2v2h-2zm-2 2h2v2h-2zM7 2h2v2H7z',
  person: 'M6 1h4v4H6zM4 6h8v5h-2v4H8v-4H7v4H5v-4H4z',
  pigeon: 'M9 2h4v1h1v3h-3v5H9v2H4v-1H2V7h2v1h2V6h2V4h1zM4 13h2v2H4zm4 0h2v2H8z',
  coffee: 'M4 5h8v1h3v5h-3v2H4zm8 3v1h1V8zM3 14h10v1H3zM5 1h1v3H5zm4 0h1v3H9z',
  case: 'M6 2h4v1h1v2h3v8H2V5h3V3h1zm1 2v1h2V4zM3 8v1h4v1h2V9h4V8z',
  medal: 'M3 1h3l2 4 2-4h3l-3 6h1v1h1v4h-1v1H5v-1H4V8h1V7zm4 7v1H6v2h1v1h2v-1h1V9H9V8z',
};

/** Original grid-drawn icons: crisp, consistent, and no external asset requests. */
export function GameGlyph({ name }: { name: Glyph }) {
  return <svg className={`game-glyph glyph-${name}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <path d={paths[name]} fill="currentColor" fillRule="evenodd" />
  </svg>;
}
