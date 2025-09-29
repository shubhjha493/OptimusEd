// QR Code scanner utilities
import { requestCameraAccess, stopCameraStream } from './camera';
import jsQR from 'jsqr';

export interface QRScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

export class QRScanner {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private scanInterval: number | null = null;

  async startScanning(videoElementId: string): Promise<void> {
    try {
      this.stream = await requestCameraAccess();
      this.videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
      
      if (!this.videoElement) {
        throw new Error('Video element not found');
      }

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Create canvas for image processing
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    } catch (error) {
      console.error('QR Scanner start error:', error);
      throw error;
    }
  }

  stopScanning(): void {
    if (this.scanInterval) {
      cancelAnimationFrame(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      stopCameraStream(this.stream);
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  // Real-time QR code detection
  startRealTimeScanning(onResult: (result: QRScanResult) => void): void {
    if (!this.videoElement || !this.canvas || !this.context) {
      console.log('QR Scanner: Not properly initialized');
      onResult({ success: false, error: 'Scanner not properly initialized' });
      return;
    }

    console.log('QR Scanner: Starting real-time scanning...');
    let scanCount = 0;

    const scan = () => {
      if (this.videoElement?.readyState === this.videoElement?.HAVE_ENOUGH_DATA) {
        scanCount++;
        
        // Set canvas size to match video
        this.canvas!.height = this.videoElement.videoHeight;
        this.canvas!.width = this.videoElement.videoWidth;

        // Draw video frame to canvas
        this.context!.drawImage(this.videoElement, 0, 0, this.canvas!.width, this.canvas!.height);

        // Get image data
        const imageData = this.context!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);

        // Try to detect QR code
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (qrCode) {
          // QR code detected
          console.log('QR Code detected:', qrCode.data);
          onResult({ 
            success: true, 
            data: qrCode.data 
          });
          return;
        }

        // Log scan attempts every 30 frames (roughly every second at 30fps)
        if (scanCount % 30 === 0) {
          console.log(`QR Scanner: Scanned ${scanCount} frames, no QR code found yet`);
        }
      }

      // Continue scanning if no QR code found
      if (this.scanInterval) {
        this.scanInterval = requestAnimationFrame(scan);
      }
    };

    // Start scanning
    this.scanInterval = requestAnimationFrame(scan);

    // Timeout after 10 seconds if no QR code found
    setTimeout(() => {
      if (this.scanInterval) {
        console.log('QR Scanner: Timeout - no QR code detected in 10 seconds');
        this.stopScanning();
        onResult({ 
          success: false, 
          error: 'No QR code detected. Please make sure you are scanning a valid QR code.' 
        });
      }
    }, 10000);
  }

  // Simulate QR code detection (for prototype/fallback)
  simulateQRDetection(): Promise<QRScanResult> {
    return new Promise((resolve) => {
      // Simulate scanning delay
      setTimeout(() => {
        // For demo purposes, simulate successful QR detection
        const mockQRData = `ATTENDANCE_${Date.now()}`;
        resolve({
          success: true,
          data: mockQRData
        });
      }, 2000);
    });
  }
}