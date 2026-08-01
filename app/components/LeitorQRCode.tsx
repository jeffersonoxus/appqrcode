"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onDetectar: (valor: string) => void;
};

export default function LeitorQRCode({ onDetectar }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"iniciando" | "procurando" | "erro">("iniciando");
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  useEffect(() => {
    let streamAtivo: MediaStream | null = null;
    let loopAtivo = true;

    async function iniciar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamAtivo = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setStatus("erro");
        setMensagemErro("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        return;
      }

      setStatus("procurando");

      function detectarFrame() {
        if (!loopAtivo || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // só processa quando o vídeo já tem dimensões reais
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          requestAnimationFrame(detectarFrame);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const codigo = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (codigo) {
          loopAtivo = false;
          onDetectar(codigo.data);
          return;
        }

        requestAnimationFrame(detectarFrame);
      }

      requestAnimationFrame(detectarFrame);
    }

    iniciar();

    return () => {
      loopAtivo = false;
      streamAtivo?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetectar]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
      <canvas ref={canvasRef} className="hidden" />

      {status === "iniciando" && (
        <p className="text-center mt-2 text-sm text-gray-500">Iniciando câmera...</p>
      )}
      {status === "procurando" && (
        <p className="text-center mt-2 text-sm text-gray-500">Aponte para o QR Code...</p>
      )}
      {status === "erro" && (
        <p className="text-center mt-2 text-sm text-red-500">{mensagemErro}</p>
      )}
    </div>
  );
}