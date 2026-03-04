import { useState, useRef, useEffect, useCallback } from 'react';
import type { WorkerMessage } from '../worker';

export interface TranscriberData {
    isBusy: boolean;
    isModelLoading: boolean;
    progressItems: any[];
    text: string;
    chunks: any[];
}

export function useTranscriber() {
    const [data, setData] = useState<TranscriberData>({
        isBusy: false,
        isModelLoading: false,
        progressItems: [],
        text: '',
        chunks: [],
    });

    const worker = useRef<Worker | null>(null);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker.ts', import.meta.url), {
                type: 'module',
            });

            worker.current.addEventListener('message', (e) => {
                const message = e.data;

                switch (message.status) {
                    case 'loading':
                        setData(d => ({ ...d, isModelLoading: true }));
                        break;

                    case 'progress':
                        setData(d => {
                            const items = [...d.progressItems];
                            const idx = items.findIndex(i => i.file === message.progress.file);
                            if (idx !== -1) {
                                items[idx] = message.progress;
                            } else {
                                items.push(message.progress);
                            }
                            return { ...d, progressItems: items };
                        });
                        break;

                    case 'ready':
                        setData(d => ({ ...d, isModelLoading: false, progressItems: [] }));
                        break;

                    case 'processing':
                        setData(d => ({ ...d, isBusy: true, text: '', chunks: [] }));
                        break;

                    case 'complete':
                        setData(d => ({
                            ...d,
                            isBusy: false,
                            text: message.result.text,
                            chunks: message.result.chunks || []
                        }));
                        break;

                    case 'error':
                        setData(d => ({ ...d, isBusy: false, isModelLoading: false }));
                        console.error("Transcriber worker error:", message.error);
                        break;
                }
            });
        }

        return () => {
            worker.current?.terminate();
            worker.current = null;
        };
    }, []);

    const startTranscription = useCallback((audioData: Float32Array) => {
        if (worker.current) {
            worker.current.postMessage({
                type: 'TRANSCRIBE',
                payload: { audio: audioData }
            } as WorkerMessage);
        }
    }, []);

    const loadModel = useCallback(() => {
        if (worker.current) {
            worker.current.postMessage({
                type: 'LOAD',
                payload: { model: 'Xenova/whisper-tiny' }
            } as WorkerMessage);
        }
    }, []);

    return {
        ...data,
        startTranscription,
        loadModel
    };
}
