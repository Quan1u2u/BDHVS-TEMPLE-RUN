import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { WorkerCommand } from './pose-worker-types';
import { WorkerCommandType, WorkerEventType } from './pose-worker-types';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let landmarker: PoseLandmarker | null = null;

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const cmd = event.data;

  switch (cmd.type) {
    case WorkerCommandType.Init:
      await handleInit();
      break;
    case WorkerCommandType.Detect:
      await handleDetect(cmd.bitmap, cmd.timestampMs);
      break;
    case WorkerCommandType.Stop:
      handleStop();
      break;
  }
};

async function handleInit(): Promise<void> {
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL, true);
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      numPoses: 1,
      runningMode: 'VIDEO',
    });
    self.postMessage({ type: WorkerEventType.InitDone });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[PoseWorker] INIT failed:', message);
    self.postMessage({
      type: WorkerEventType.InitError,
      error: message,
    });
  }
}

async function handleDetect(bitmap: ImageBitmap, timestampMs: number): Promise<void> {
  if (!landmarker) {
    bitmap.close();
    self.postMessage({
      type: WorkerEventType.DetectError,
      error: 'Worker not initialized',
    });
    return;
  }

  try {
    const result = landmarker.detectForVideo(bitmap, timestampMs);
    self.postMessage({ type: WorkerEventType.Result, result });
  } catch (e) {
    self.postMessage({
      type: WorkerEventType.DetectError,
      error: e instanceof Error ? e.message : String(e),
    });
  } finally {
    bitmap.close();
  }
}

function handleStop(): void {
  landmarker?.close();
  landmarker = null;
  self.postMessage({ type: WorkerEventType.StopDone });
}
