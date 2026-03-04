import { pipeline, env } from '@huggingface/transformers';

// Setup environment for optimal WebGPU / browser inference
env.allowLocalModels = false;
// Prefer WebGPU if available
if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
}

// Define message types
export type WorkerMessage =
    | { type: 'LOAD'; payload: { model: string } }
    | { type: 'TRANSCRIBE'; payload: { audio: Float32Array } }
    | { type: 'CANCEL' };

// We store the pipeline promise to prevent multiple concurrent loads
class PipelineFactory {
    static task: any = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny';
    static instance: any = null;

    static async getInstance(progress_callback: any) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, {
                progress_callback,
                device: 'webgpu', // Will fallback to wasm if WebGPU is not supported
                dtype: {
                    encoder_model: 'fp32',
                    decoder_model_merged: 'q4', // Quantized for web
                }
            });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    switch (message.type) {
        case 'LOAD': {
            try {
                self.postMessage({ status: 'loading' });

                await PipelineFactory.getInstance((data: any) => {
                    self.postMessage({
                        status: 'progress',
                        progress: data
                    });
                });

                self.postMessage({ status: 'ready' });
            } catch (err: any) {
                self.postMessage({ status: 'error', error: err.message });
            }
            break;
        }

        case 'TRANSCRIBE': {
            try {
                self.postMessage({ status: 'processing' });

                const transcriber = await PipelineFactory.getInstance(null);

                // Run inference
                // Whisper requires 16kHz audio, we assume it's already resampled by the main thread
                const result = await transcriber(message.payload.audio, {
                    chunk_length_s: 30,
                    stride_length_s: 5,
                    language: 'es', // Español
                    task: 'transcribe',
                    return_timestamps: true,
                });

                self.postMessage({
                    status: 'complete',
                    result: result
                });
            } catch (err: any) {
                console.error("Transcription error:", err);
                self.postMessage({ status: 'error', error: err.message });
            }
            break;
        }
    }
});
