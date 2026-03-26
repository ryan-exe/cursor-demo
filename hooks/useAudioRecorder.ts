import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

export interface RecordingResult {
  base64: string;
  mimeType: string;
}

export function useAudioRecorder(onMeteringUpdate: (db: number) => void) {
  const [isRecording, setIsRecording] = useState(false);

  // ---- Native: expo-audio ----
  const recorder = useExpoAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);

  // Forward metering to caller whenever it changes during recording
  useEffect(() => {
    if (Platform.OS !== 'web' && isRecording && recorderState.metering !== undefined) {
      onMeteringUpdate(recorderState.metering);
    }
  }, [recorderState.metering, isRecording]);

  // ---- Web refs ----
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') {
      await startWebRecording();
    } else {
      await requestRecordingPermissionsAsync();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
    setIsRecording(true);
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    setIsRecording(false);
    onMeteringUpdate(-60);
    if (Platform.OS === 'web') {
      return await stopWebRecording();
    } else {
      return await stopNativeRecording();
    }
  }, [recorder]);

  // ---- Native helpers ----

  const stopNativeRecording = async (): Promise<RecordingResult | null> => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) return null;
    const { readAsStringAsync } = await import('expo-file-system/legacy');
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return { base64, mimeType: 'audio/m4a' };
  };

  // ---- Web helpers ----

  const startWebRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const pollMetering = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const db = avg === 0 ? -60 : -60 + (avg / 255) * 60;
      onMeteringUpdate(db);
      animFrameRef.current = requestAnimationFrame(pollMetering);
    };
    animFrameRef.current = requestAnimationFrame(pollMetering);

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
  };

  const stopWebRecording = (): Promise<RecordingResult> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        resolve({ base64: '', mimeType: 'audio/webm' });
        return;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const base64 = await blobToBase64(blob);
        resolve({ base64, mimeType });
      };
      mediaRecorder.stop();
    });
  };

  return { isRecording, startRecording, stopRecording };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
