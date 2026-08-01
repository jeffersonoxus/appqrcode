"use client";
import { useState } from "react";
import LeitorGabarito from "../components/LeitorGabarito";

export default function PaginaLeitorGabarito() {
  const [respostas, setRespostas] = useState<Record<number, string | null> | null>(null);

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Leitor de Gabarito</h1>

      {!respostas && <LeitorGabarito onLido={setRespostas} />}

      {respostas && (
        <div className="mt-4 bg-white border rounded-lg p-3">
          <p className="font-semibold mb-2">Respostas lidas:</p>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {Object.entries(respostas).map(([questao, alt]) => (
              <div key={questao} className="bg-gray-50 rounded p-2 text-center">
                <span className="text-gray-500">{questao}:</span>{" "}
                <span className="font-mono font-bold">{alt ?? "—"}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRespostas(null)}
            className="w-full mt-3 py-2 bg-blue-600 text-white rounded"
          >
            Ler outro
          </button>
        </div>
      )}
    </main>
  );
}