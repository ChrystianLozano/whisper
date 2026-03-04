// Converts Blob/File to 16kHz Float32Array required by Whisper
export async function resampleAudio(audioBlob: Blob | File): Promise<Float32Array> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
    });

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Whisper model expects mono audio
    // If stereo, average the channels or just take the first one
    const channelData = audioBuffer.getChannelData(0);

    // You can optionally implement better downmixing here if needed
    return channelData;
}
