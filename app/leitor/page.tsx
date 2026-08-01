"use client";
import { useState } from "react";
import LeitorQRCode from "../components/LeitorQRCode";

export default function PaginaLeitor() {
  const [resultado, setResultado] = useState<string | null>(null);

  function handleDetectar(valor: string) {
    setResultado(valor);
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Leitor de QR Code</h1>

      {!resultado && <LeitorQRCode onDetectar={handleDetectar} />}

      {resultado && (
        <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <p className="font-semibold text-green-700">QR Code detectado</p>
          </div>

          <div className="bg-gray-50 rounded p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">Conteúdo lido:</p>
            <p className="break-all font-mono text-sm text-gray-800">{resultado}</p>
          </div>

          <button
            onClick={() => setResultado(null)}
            className="w-full py-2 bg-blue-600 text-white rounded font-medium"
          >
            Ler outro QR Code
          </button>
        </div>
      )}
    </main>
  );
}