import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  trackingCode: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator = ({ trackingCode, size = 200, className }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  // Generate the tracking URL
  const trackingUrl = `${window.location.origin}/track/${trackingCode}`;

  useEffect(() => {
    if (canvasRef.current && trackingCode) {
      QRCode.toCanvas(canvasRef.current, trackingUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [trackingCode, trackingUrl, size]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL();
      const a = document.createElement('a');
      a.download = `QR_${trackingCode}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "QR Code Downloaded",
        description: `QR code for ${trackingCode} has been downloaded`,
      });
    }
  };

  const copyTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast({
        title: "URL Copied",
        description: "Tracking URL has been copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="border rounded-lg p-4 bg-white">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Tracking Code: {trackingCode}</p>
        <p className="text-xs text-muted-foreground">
          Scan to track job progress
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={downloadQR}>
          <Download className="h-4 w-4 mr-2" />
          Download QR
        </Button>
        <Button variant="outline" size="sm" onClick={copyTrackingUrl}>
          <Copy className="h-4 w-4 mr-2" />
          Copy URL
        </Button>
      </div>
    </div>
  );
};