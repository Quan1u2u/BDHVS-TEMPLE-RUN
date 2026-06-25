import { CollectibleType } from '../domain/types';

export const collectibleValue: Record<CollectibleType, number> = {
  [CollectibleType.AI]: 20,
  [CollectibleType.Cloud]: 20,
  [CollectibleType.STEM]: 10,
  [CollectibleType.DigitalCitizen]: 5,
  [CollectibleType.ELearning]: 5,
};
