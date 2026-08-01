"use client";
import { useEffect, useRef, useState } from "react";
import { useOpenCV } from "../hooks/useOpenCV";
import {
  encontrarAncoras,
  corrigirPerspectiva,
  lerRespostas,
  LARGURA_CORRIGIDA,
  ALTURA_CORRIGIDA,
} from "../lib/omrProcessamento";

type Props = {
  onLido: (respostas: Record<number, string | null>) => void;
};

export default function LeitorGabarito({ onLido }: Props) {
  const { cv, pronto } = useOpenCV();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Carregando OpenCV...");

  useEffect(() => {
    if (!pronto) return;

    let streamAtivo: MediaStream | null = null;
    let loopAtivo = true;

    async function iniciar() {
      setStatus("Iniciando câmera...");

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
      } catch {
        setStatus("Erro ao acessar a câmera.");
        return;
      }

      setStatus("Procurando gabarito...");
      processarFrame();
    }

    function processarFrame() {
      if (!loopAtivo || !videoRef.current || !canvasRef.current || !cv) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0) {
        requestAnimationFrame(processarFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const matOriginal = cv.imread(canvas);
      const matCinza = new cv.Mat();
      cv.cvtColor(matOriginal, matCinza, cv.COLOR_RGBA2GRAY);

      const cantos = encontrarAncoras(cv, matCinza);

      if (cantos.length === 4) {
        setStatus("Gabarito detectado! Processando...");

        const matCorrigida = corrigirPerspectiva(cv, matOriginal, cantos);
        const matCorrigidaCinza = new cv.Mat();
        cv.cvtColor(matCorrigida, matCorrigidaCinza, cv.COLOR_RGBA2GRAY);

        const matBinaria = new cv.Mat();
        cv.adaptiveThreshold(
          matCorrigidaCinza,
          matBinaria,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY_INV,
          25,
          10
        );

        const respostas = lerRespostas(cv, matBinaria);

        matCorrigida.delete();
        matCorrigidaCinza.delete();
        matBinaria.delete();
        matOriginal.delete();
        matCinza.delete();

        loopAtivo = false;
        onLido(respostas);
        return;
      }

      matOriginal.delete();
      matCinza.delete();

      requestAnimationFrame(processarFrame);
    }

    iniciar();

    return () => {
      loopAtivo = false;
      streamAtivo?.getTracks().forEach((t) => t.stop());
    };
  }, [pronto, cv, onLido]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-center mt-2 text-sm text-gray-500">{status}</p>
    </div>
  );
}