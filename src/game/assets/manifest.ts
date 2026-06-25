export const assetBundles = {
  boot: [{ id: 'brand-mark', src: '/BDHVS-TEMPLE-RUN/favicon.svg' }],
  gameplay: [{ id: 'tilesheet', src: '/BDHVS-TEMPLE-RUN/game/tiles/tilemap_packed.png' }],
  debug: [],
} as const;

export type AssetBundleName = keyof typeof assetBundles;
export type GameAssetId = (typeof assetBundles)[AssetBundleName][number]['id'];

export interface AssetRegistry {
  loadBundle: (bundleName: AssetBundleName) => Promise<void>;
  isBundleLoaded: (bundleName: AssetBundleName) => boolean;
}
