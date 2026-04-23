/**
 * ARQUIVO: main.tsx
 * DESCRIÇÃO: Ponto de entrada da aplicação
 * FUNCIONALIDADES:
 *   - Inicializa React com StrictMode (detecção de problemas em desenvolvimento)
 *   - Envolve com BrowserRouter para suporte a roteamento
 *   - Monta aplicação no elemento com id="root" do HTML
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);                                                                                      