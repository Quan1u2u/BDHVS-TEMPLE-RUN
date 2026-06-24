import { PoseCommand } from '../domain/types';

interface Landmark {
  x: number;
  y: number;
}

export interface PoseClassifierState {
  baseNoseX: number | null;
  baseNoseY: number | null;
  emaTilt: number;
}

export interface PoseClassificationResult {
  command: PoseCommand;
  nextState: PoseClassifierState;
}

const EMA_ALPHA = 0.22;
const LEAN_DEADZONE = 0.055;
const JUMP_THRESHOLD = 0.12;
const HANDS_UP_THRESHOLD = 0.12;

export function createInitialPoseClassifierState(): PoseClassifierState {
  return {
    baseNoseX: null,
    baseNoseY: null,
    emaTilt: 0,
  };
}

export function classifyPose(
  landmarks: readonly Landmark[],
  state: PoseClassifierState,
): PoseClassificationResult {
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  if (!nose || !leftShoulder || !rightShoulder) {
    return { command: PoseCommand.Idle, nextState: state };
  }

  const baseNoseX = state.baseNoseX ?? nose.x;
  const baseNoseY = state.baseNoseY ?? nose.y;
  const rawTilt = leftShoulder.y - rightShoulder.y;
  const emaTilt = EMA_ALPHA * rawTilt + (1 - EMA_ALPHA) * state.emaTilt;
  const noseRise = baseNoseY - nose.y;
  const handsUp =
    Boolean(leftWrist && leftWrist.y < leftShoulder.y - HANDS_UP_THRESHOLD) ||
    Boolean(rightWrist && rightWrist.y < rightShoulder.y - HANDS_UP_THRESHOLD);

  let command = PoseCommand.Idle;

  if (handsUp || noseRise > JUMP_THRESHOLD) {
    command = PoseCommand.Jump;
  } else if (emaTilt < -LEAN_DEADZONE) {
    command = PoseCommand.MoveLeft;
  } else if (emaTilt > LEAN_DEADZONE) {
    command = PoseCommand.MoveRight;
  }

  return {
    command,
    nextState: {
      baseNoseX: baseNoseX * 0.98 + nose.x * 0.02,
      baseNoseY: baseNoseY * 0.98 + nose.y * 0.02,
      emaTilt,
    },
  };
}
