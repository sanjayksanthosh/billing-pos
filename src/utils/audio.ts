import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Standard 1750Hz short crisp beep (PCM 8-bit mono 8000Hz base64 data URI)
const BEEP_WAV_BASE64 =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoGAAAA' +
  'AAAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAA' +
  'AAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/' +
  'vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAA' +
  'AAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/' +
  'vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAAAAC/v78AAAAAAL+/vwAAAAAAv7+/AAAA';

let audioPlayer: any = null;

export async function playScannerBeep() {
  // 1. Instant physical haptic feedback (iOS & Android)
  try {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  } catch {}

  // 2. Web context - Web Audio oscillator
  if (Platform.OS === 'web') {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1750, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}
    return;
  }

  // 3. Native iOS / Android via expo-audio
  try {
    const { createAudioPlayer } = await import('expo-audio');
    if (!audioPlayer) {
      audioPlayer = createAudioPlayer({ uri: BEEP_WAV_BASE64 });
    }
    audioPlayer.seekTo(0);
    audioPlayer.play();
  } catch {
    // Graceful fallback: audio error will never crash barcode scanning
  }
}
