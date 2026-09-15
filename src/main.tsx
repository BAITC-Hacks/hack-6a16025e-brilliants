import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LectureAI from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LectureAI />
  </StrictMode>
);
