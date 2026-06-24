import { Assets } from 'pixi.js';

import type { AssetBundleName } from './manifest';
import { assetBundles } from './manifest';

// biome-ignore lint/complexity/noStaticOnlyClass: Static asset lifecycle is intentional for the game bootstrap path.
export class AssetPipeline {
  private static readonly loadedBundles = new Set<AssetBundleName>();
  private static initialized = false;

  public static async loadBundle(bundleName: AssetBundleName): Promise<void> {
    if (!AssetPipeline.initialized) {
      AssetPipeline.registerBundles();
    }

    if (AssetPipeline.loadedBundles.has(bundleName)) {
      return;
    }

    const bundle = assetBundles[bundleName];
    if (bundle.length > 0) {
      await Assets.loadBundle(bundleName);
    }

    AssetPipeline.loadedBundles.add(bundleName);
  }

  public static isBundleLoaded(bundleName: AssetBundleName): boolean {
    return AssetPipeline.loadedBundles.has(bundleName);
  }

  private static registerBundles(): void {
    for (const [bundleName, bundleAssets] of Object.entries(assetBundles) as Array<
      [AssetBundleName, (typeof assetBundles)[AssetBundleName]]
    >) {
      if (bundleAssets.length > 0) {
        Assets.addBundle(
          bundleName,
          bundleAssets.map((asset) => ({ alias: asset.id, src: asset.src })),
        );
      }
    }

    AssetPipeline.initialized = true;
  }
}
