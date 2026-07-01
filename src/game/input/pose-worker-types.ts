import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

export enum WorkerCommandType {
  Init = 'INIT',
  Detect = 'DETECT',
  Stop = 'STOP',
}

export enum WorkerEventType {
  InitDone = 'INIT_DONE',
  InitError = 'INIT_ERROR',
  Result = 'RESULT',
  DetectError = 'DETECT_ERROR',
  StopDone = 'STOP_DONE',
}

export type WorkerCommand =
  | { type: WorkerCommandType.Init }
  | { type: WorkerCommandType.Detect; bitmap: ImageBitmap; timestampMs: number }
  | { type: WorkerCommandType.Stop };

export type WorkerEvent =
  | { type: WorkerEventType.InitDone }
  | { type: WorkerEventType.InitError; error: string }
  | { type: WorkerEventType.Result; result: PoseLandmarkerResult }
  | { type: WorkerEventType.DetectError; error: string }
  | { type: WorkerEventType.StopDone };
