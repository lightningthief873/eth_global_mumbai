"use client";

import { useEffect, useRef, useState } from "react";
import { startCamera, stopCamera, captureFrame, blobToDataUrl } from "@/lib/camera";

interface Props {
  onCapture: (blob: Blob, preview: string) => void;
  label?: string;
}

export default function CameraCapture({ onCapture, label = "Capture" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let s: MediaStream;
    (async () => {
      try {
        if (!videoRef.current) return;
        s = await startCamera(videoRef.current);
        setStream(s);
      } catch {
        setError("Camera access denied. Grant permission or upload a file below.");
      }
    })();
    return () => stopCamera(s ?? null);
  }, []);

  async function capture() {
    if (!videoRef.current) return;
    setLoading(true);
    try {
      const blob = await captureFrame(videoRef.current);
      const url = await blobToDataUrl(blob);
      setPreview(url);
      onCapture(blob, url);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function retake() {
    setPreview(null);
    setError(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await blobToDataUrl(file);
    setPreview(url);
    onCapture(file, url);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Video / Preview */}
      <div
        style={{
          background: "#000",
          borderRadius: "12px",
          border: "1px solid var(--fp-border)",
          overflow: "hidden",
          aspectRatio: "4/3",
          position: "relative",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Capture preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {!stream && !preview && !error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--fp-muted)", fontSize: "0.85rem" }}>Starting camera…</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "var(--fp-error)", fontSize: "0.82rem" }}>{error}</p>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!preview ? (
          <button
            className="fp-btn fp-btn-primary"
            style={{ flex: 1 }}
            onClick={capture}
            disabled={!stream || loading}
          >
            {loading ? "Capturing…" : `📸 ${label}`}
          </button>
        ) : (
          <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={retake}>
            ↺ Retake
          </button>
        )}
      </div>

      {/* File upload fallback */}
      <label style={{ cursor: "pointer", fontSize: "0.78rem", color: "var(--fp-muted)", textAlign: "center" }}>
        or upload an image file{" "}
        <span style={{ color: "var(--fp-accent)", textDecoration: "underline" }}>here</span>
        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
      </label>
    </div>
  );
}
