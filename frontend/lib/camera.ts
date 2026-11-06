/**
 * Camera utilities for face capture.
 * Raw frames are processed in-memory; nothing is persisted on the client.
 */

export async function startCamera(videoEl: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  });
  videoEl.srcObject = stream;
  // play() can reject with AbortError when the element is torn down mid-start;
  // that is harmless — the stream is still attached and usable.
  await videoEl.play().catch(() => {});
  return stream;
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

export function captureFrame(videoEl: HTMLVideoElement): Promise<Blob> {
  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) { reject(new Error("Canvas context unavailable")); return promise; }
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(
    (blob) => { blob ? resolve(blob) : reject(new Error("Failed to capture frame")); },
    "image/jpeg",
    0.92
  );
  return promise;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  const { promise, resolve } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result as string);
  reader.readAsDataURL(blob);
  return promise;
}
