import type {
  TierSetDefinition,
  TierSetId,
  TierSetSummary,
} from "@twf/contracts";
import { TIERSET_PRESETS } from "./builtIns.js";

type TierSetRecord = TierSetDefinition & { coverImageSrc?: string };
const LOBBY_PREVIEW_WIDTH_PX = 120;

const BUILTINS: TierSetRecord[] = TIERSET_PRESETS as TierSetRecord[];
const byId = new Map<TierSetId, TierSetDefinition>(
  BUILTINS.map((s) => [s.id, s]),
);

function toPreviewImageSrc(src?: string): string | undefined {
  if (!src) return undefined;

  try {
    const url = new URL(src);
    const filePathPrefix = "/wiki/Special:FilePath/";

    if (!url.pathname.startsWith(filePathPrefix)) return src;

    const encodedFileName = url.pathname.slice(filePathPrefix.length);
    if (!encodedFileName) return src;

    url.pathname = "/w/index.php";
    url.search = new URLSearchParams({
      title: `Special:Redirect/file/${decodeURIComponent(encodedFileName)}`,
      width: String(LOBBY_PREVIEW_WIDTH_PX),
    }).toString();

    return url.toString();
  } catch {
    return src;
  }
}

export function listTierSets(): TierSetSummary[] {
  return BUILTINS.map((s) => {
    const firstItem = s.items[0];
    return {
      ...s,
      ...(s.coverImageSrc ? { coverImageSrc: s.coverImageSrc } : {}),
      itemCount: s.items.length,
      firstItemName: firstItem?.name,
      firstItemImageSrc: toPreviewImageSrc(firstItem?.imageSrc),
    } as TierSetSummary;
  });
}

export function getTierSet(id: TierSetId): TierSetDefinition | undefined {
  return byId.get(id);
}
