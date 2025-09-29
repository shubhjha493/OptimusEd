// Camera utilities for attendance system
export async function requestCameraAccess(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    return stream;
  } catch (error) {
    console.error('Camera access error:', error);
    throw new Error('Camera access denied or not available');
  }
}

export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

export function attachStreamToVideo(stream: MediaStream, videoElementId: string): void {
  const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
  if (videoElement) {
    videoElement.srcObject = stream;
    videoElement.play();
  }
}