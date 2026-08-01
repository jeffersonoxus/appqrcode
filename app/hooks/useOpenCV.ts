"use client";
import { useEffect, useState } from "react";

export function useOpenCV() {
  const [pronto, setPronto] = useState(false);
  const [cv, setCv] = useState<any>(null);

  useEffect(() => {
    let montado = true;

    import("@techstark/opencv-js").then((modulo) => {
      const cvInstancia = modulo.default;

      cvInstancia.onRuntimeInitialized = () => {
        if (montado) {
          setCv(cvInstancia);
          setPronto(true);
        }
      };
    });

    return () => {
      montado = false;
    };
  }, []);

  return { cv, pronto };
}