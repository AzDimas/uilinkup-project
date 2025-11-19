# embed_service.py
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

# 💡 model 1024-dim (sesuai yang kamu pakai di Neon)
MODEL_NAME = "BAAI/bge-m3"

print(f"🔁 Loading embedding model: {MODEL_NAME} ...")
model = SentenceTransformer(MODEL_NAME)
print("✅ Model loaded.")

app = FastAPI()


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    vectors: list[list[float]]


@app.get("/health")
async def health():
    return {"ok": True, "model": MODEL_NAME}


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    # encode tanpa normalisasi (normalisasi sudah kamu lakukan di Node)
    emb = model.encode(
        req.texts,
        normalize_embeddings=False,
        convert_to_numpy=True,
    )
    if isinstance(emb, np.ndarray):
        emb = emb.tolist()
    return {"vectors": emb}
