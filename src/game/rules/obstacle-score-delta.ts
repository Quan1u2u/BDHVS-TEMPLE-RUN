import { ObstacleType } from '../domain/types';

export const obstacleScoreDelta: Record<ObstacleType, number> = {
  [ObstacleType.Virus]: -20,
  [ObstacleType.Hacker]: -20,
  [ObstacleType.Scam]: -10,
  [ObstacleType.FakeNews]: -5,
  [ObstacleType.Cyberbullying]: -5,
};
