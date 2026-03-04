import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
}

export function AudioVisualizer({ stream }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!stream || !canvasRef.current) return;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;
        source.connect(analyser);

        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
            if (!canvas || !canvasCtx || !analyserRef.current || !dataArrayRef.current) return;

            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            animationRef.current = requestAnimationFrame(draw);

            analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            const barWidth = (WIDTH / dataArrayRef.current.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArrayRef.current.length; i++) {
                barHeight = dataArrayRef.current[i] / 2;

                canvasCtx.fillStyle = `rgba(59, 130, 246, ${barHeight / 100})`; // Tailwind primary (Blue)

                canvasCtx.beginPath();
                canvasCtx.roundRect(x, HEIGHT - barHeight, barWidth, barHeight, 4);
                canvasCtx.fill();

                x += barWidth + 2;
            }
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [stream]);

    if (!stream) return null;

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={100}
            className="w-full max-w-[300px] h-[100px] object-contain mx-auto"
        />
    );
}
