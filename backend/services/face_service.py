"""
Face recognition service.

MOCK IMPLEMENTATION — deterministic hash-based embeddings.
Enroll with an image; recognize by submitting the same image bytes.
Same file → same embedding → match. Different files → different embeddings → no match.

TODO: replace embed() with real InsightFace inference:
    import insightface
    app = insightface.app.FaceAnalysis()
    app.prepare(ctx_id=0)
    faces = app.get(cv2.imdecode(...))
    return faces[0].embedding / np.linalg.norm(faces[0].embedding)
"""

import hashlib
from typing import Optional

import numpy as np

EMBEDDING_DIM = 128
DTYPE = np.float32


def embed(image_bytes: bytes) -> np.ndarray:
    """Return a deterministic L2-normalised float32 embedding for the given image bytes."""
    seed = int(hashlib.sha256(image_bytes).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(EMBEDDING_DIM).astype(DTYPE)
    return vec / np.linalg.norm(vec)


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.dot(a.astype(np.float64), b.astype(np.float64)))


def match(
    query: np.ndarray,
    candidates: list[tuple[str, np.ndarray]],
    threshold: float,
) -> Optional[tuple[str, float]]:
    """
    Return (address, distance) of the best match below threshold, or None.
    Lower distance = better match (0 = identical).
    """
    best_addr: Optional[str] = None
    best_dist = threshold
    for addr, emb in candidates:
        d = cosine_distance(query, emb)
        if d < best_dist:
            best_addr, best_dist = addr, d
    if best_addr is not None:
        return best_addr, best_dist
    return None


def embedding_to_hex(emb: np.ndarray) -> str:
    return emb.astype(DTYPE).tobytes().hex()


def hex_to_embedding(hex_str: str) -> np.ndarray:
    return np.frombuffer(bytes.fromhex(hex_str), dtype=DTYPE).copy()
