import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./css/index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Upload from "./components/Upload";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
