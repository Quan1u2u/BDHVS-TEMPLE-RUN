import { ObstacleType } from '../domain/types';

export const obstacleScoreDelta: Record<ObstacleType, number> = {
  [ObstacleType.Rock]: -120,
  [ObstacleType.FireTrap]: -180,
  [ObstacleType.Totem]: -90,
};
