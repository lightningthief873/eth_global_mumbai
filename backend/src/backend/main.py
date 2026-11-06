from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import create_db_and_tables
from .api.face import router as face_router
from .api.wallet import router as wallet_router
from .api.payment import router as payment_router
from .api.policy import router as policy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="FacePay API",
    description="Face-biometric payment protocol on Whitechain",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_router,    prefix="/api/face",    tags=["face"])
app.include_router(wallet_router,  prefix="/api/wallet",  tags=["wallet"])
app.include_router(payment_router, prefix="/api/payment", tags=["payment"])
app.include_router(policy_router,  prefix="/api/policy",  tags=["policy"])


@app.get("/health")
def health():
    from .services.chain_service import is_connected
    return {"status": "ok", "chain_connected": is_connected()}


def main():
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
