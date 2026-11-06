"""
Face recognition service backed by InsightFace (ArcFace buffalo_l).

embed()  -> 512-dim L2-normalised face embedding from raw image bytes.
match()  -> nearest enrolled identity by cosine distance, below a threshold.

The buffalo_l model (~280MB) downloads automatically on first use to
~/.insightface/models. Raw images are processed in-memory and never persisted.
"""

from typing import Optional

import numpy as np

DTYPE = np.float32
_app = None


def _model():
    """Lazily load the InsightFace analysis pipeline (detection + recognition)."""
    global _app
    if _app is None:
        import insightface

        _app = insightface.app.FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )
        _app.prepare(ctx_id=0, det_size=(640, 640))
    return _app


def embed(image_bytes: bytes) -> np.ndarray:
    """Return the L2-normalised embedding of the most prominent face in the image.
    Raises ValueError if no face is detected."""
    import cv2

    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    faces = _model().get(img)
    if not faces:
        raise ValueError("No face detected")

    # Largest detected face wins (closest to the camera).
    faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
    emb = faces[0].normed_embedding.astype(DTYPE)
    return emb / np.linalg.norm(emb)


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.dot(a.astype(np.float64), b.astype(np.float64)))


def match(
    query: np.ndarray,
    candidates: list[tuple[str, np.ndarray]],
    threshold: float,
) -> Optional[tuple[str, float]]:
    """Return (address, distance) of the closest identity below threshold, else None."""
    best_addr: Optional[str] = None
    best_dist = threshold
    for addr, emb in candidates:
        d = cosine_distance(query, emb)
        if d < best_dist:
            best_addr, best_dist = addr, d
    return (best_addr, best_dist) if best_addr is not None else None


def embedding_to_hex(emb: np.ndarray) -> str:
    return emb.astype(DTYPE).tobytes().hex()


def hex_to_embedding(hex_str: str) -> np.ndarray:
    return np.frombuffer(bytes.fromhex(hex_str), dtype=DTYPE).copy()
