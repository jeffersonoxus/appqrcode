"use client";
import { useEffect, useState } from "react";

export function useOpenCV() {
  const [pronto, setPronto] = useState(false);
  const [cv, setCv] = useState<any>(null);

  useEffect(() => {
    let montado = true;

    import("@techstark/opencv-js").then((modulo) => {
      const cvInstancia = modulo.default;

      // opencv-js expõe um callback onRuntimeInitialized quando o WASM termina de carregar
      if (cvInstancia.getBuildInformation) {
        // já estava pronto (raro, mas possível em recarregamentos)
        if (montado) {
          setCv(cvInstancia);
          setPronto(true);
        }
      } else {
        cvInstancia.onRuntimeInitialized = () => {
          if (montado) {
            setCv(cvInstancia);
            setPronto(true);
          }
        };
      }
    });

    return () => {
      montado = false;
    };
  }, []);

  return { cv, pronto };
}