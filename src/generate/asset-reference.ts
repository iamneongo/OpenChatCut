import type { MediaAsset } from '../editor/types';

/** Exact identity wins; shortened ids are accepted only when unambiguous. */
export function findAssetByReference(
  ref: string,
  assets: readonly MediaAsset[],
): MediaAsset | undefined {
  const clean = ref.replace(/^asset:\/\//, '').trim();
  if (!clean) return undefined;
  const exactId = assets.find((asset) => asset.id === clean);
  if (exactId) return exactId;
  const exactLocation = assets.filter((asset) => asset.name === clean || asset.src === clean);
  if (exactLocation.length === 1) return exactLocation[0];
  if (exactLocation.length > 1) throw new Error(`Tham chiếu tệp không rõ ràng: ${ref}`);
  const prefix = assets.filter((asset) => asset.id.startsWith(clean));
  if (prefix.length > 1) throw new Error(`Tiền tố ID tệp không rõ ràng: ${ref}`);
  return prefix[0];
}
