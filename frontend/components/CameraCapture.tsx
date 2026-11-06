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

  const live = !!stream && !preview && !error;

  return (
    <div className="flex flex-col gap-3">
      {/* Video / Preview with reticle framing */}
      <div
        className="fp-reticle relative overflow-hidden"
        style={{
          background: "#000",
          borderRadius: "14px",
          border: "1px solid var(--fp-border)",
          aspectRatio: "4/3",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Capture preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        )}

        {/* scanline + readout only while the live feed is active */}
        {live && (
          <>
            <div className="fp-scanline" style={{ top: "6%" }} />
            <div
              className="absolute left-3 bottom-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em", color: "var(--fp-accent)", textTransform: "uppercase" }}
            >
              <span className="fp-badge fp-badge-info fp-badge-live" style={{ padding: "0.18rem 0.5rem", fontSize: "0.6rem" }}>
                Live
              </span>
              <span>Align face in frame</span>
            </div>
          </>
        )}

        {/* preview confirmed tag */}
        {preview && (
          <div
            className="absolute left-3 bottom-3"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.14em", color: "var(--fp-accent)", textTransform: "uppercase" }}
          >
            <span className="fp-badge fp-badge-info" style={{ padding: "0.18rem 0.5rem", fontSize: "0.6rem" }}>
              Captured
            </span>
          </div>
        )}

        {!stream && !preview && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <span className="fp-spinner" style={{ width: "1.1rem", height: "1.1rem" }} />
            <span style={{ color: "var(--fp-muted)", fontSize: "0.82rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
              STARTING CAMERA
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p style={{ color: "var(--fp-error)", fontSize: "0.82rem" }}>{error}</p>}

      {/* Controls */}
      <div className="flex gap-2">
        {!preview ? (
          <button className="fp-btn fp-btn-primary" style={{ flex: 1 }} onClick={capture} disabled={!stream || loading}>
            {loading ? "Capturing…" : label}
          </button>
        ) : (
          <button className="fp-btn fp-btn-ghost" style={{ flex: 1 }} onClick={retake}>
            ↺ Retake
          </button>
        )}
      </div>

      {/* File upload fallback */}
      <label className="text-center" style={{ cursor: "pointer", fontSize: "0.76rem", color: "var(--fp-muted)" }}>
        or upload an image file{" "}
        <span className="fp-link" style={{ textDecoration: "underline" }}>here</span>
        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
      </label>
    </div>
  );
}
