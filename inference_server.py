"""
FastAPI inference server for the Attention-Augmented LSTM classifier.

Usage:
    uvicorn inference_server:app --host 0.0.0.0 --port 8000

Endpoints:
    GET  /health       — liveness check, returns device & label names
    POST /classify     — batch classify a list of texts
"""

import json
import pickle
import re
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ── Paths ────────────────────────────────────────────────────────────────────
SAVE_DIR = Path(__file__).parent / "saved_model"


# ── Model architecture (must match the training notebook exactly) ─────────────

class BahdanauAttention(nn.Module):
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Linear(hidden_dim, hidden_dim)
        self.v = nn.Linear(hidden_dim, 1, bias=False)

    def forward(self, hidden: torch.Tensor, mask: torch.Tensor | None = None):
        scores = self.v(torch.tanh(self.attn(hidden))).squeeze(-1)   # (B, T)
        if mask is not None:
            scores = scores.masked_fill(~mask, -1e9)
        weights = torch.softmax(scores, dim=-1)                       # (B, T)
        context = torch.bmm(weights.unsqueeze(1), hidden).squeeze(1) # (B, H)
        return context, weights


class AttentionLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim,
                 n_layers, n_classes, dropout, pad_idx=0):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=pad_idx)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=n_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if n_layers > 1 else 0.0,
        )
        self.attention = BahdanauAttention(hidden_dim * 2)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * 2, n_classes)

    def forward(self, x: torch.Tensor):
        mask = (x != 0)
        embed = self.dropout(self.embedding(x))
        out, _ = self.lstm(embed)
        context, weights = self.attention(out, mask)
        logits = self.fc(self.dropout(context))
        return logits, weights


# ── Load artefacts at startup ─────────────────────────────────────────────────

print("Loading model artefacts...")

with open(SAVE_DIR / "config.json") as f:
    cfg = json.load(f)

with open(SAVE_DIR / "vocab.pkl", "rb") as f:
    word2idx: dict[str, int] = pickle.load(f)

LABEL_NAMES: list[str] = cfg["label_names"]
MAX_SEQ_LEN: int = cfg["max_seq_len"]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

model = AttentionLSTM(
    vocab_size=cfg["vocab_size"],
    embed_dim=cfg["embed_dim"],
    hidden_dim=cfg["hidden_dim"],
    n_layers=cfg["n_layers"],
    n_classes=cfg["n_classes"],
    dropout=cfg["dropout"],
).to(device)

model.load_state_dict(
    torch.load(SAVE_DIR / "best_weights.pt", map_location=device, weights_only=True)
)
model.eval()
print(f"Model ready. Labels: {LABEL_NAMES}")


# ── Tokenisation / encoding ───────────────────────────────────────────────────

def encode(text: str) -> list[int]:
    tokens = re.findall(r"\b[a-z0-9]+\b", text.lower())[:MAX_SEQ_LEN]
    ids = [word2idx.get(t, 1) for t in tokens]
    if not ids:
        ids = [1]  # at least one UNK so attention softmax doesn't get NaN
    ids += [0] * (MAX_SEQ_LEN - len(ids))
    return ids


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="LSTM Classifier", version="1.0")


class ClassifyRequest(BaseModel):
    texts: list[str]


class ClassifyResult(BaseModel):
    label: str
    confidence: float
    all_probs: dict[str, float]


class ClassifyResponse(BaseModel):
    results: list[ClassifyResult]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(device),
        "labels": LABEL_NAMES,
    }


@app.post("/classify", response_model=ClassifyResponse)
@torch.no_grad()
def classify_batch(req: ClassifyRequest):
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts list must not be empty")

    x = torch.tensor(
        [encode(t) for t in req.texts], dtype=torch.long
    ).to(device)

    logits, _ = model(x)
    probs_np = torch.softmax(logits, dim=-1).cpu().numpy()

    results = []
    for p in probs_np:
        idx = int(p.argmax())
        results.append(
            ClassifyResult(
                label=LABEL_NAMES[idx],
                confidence=float(p[idx]),
                all_probs={LABEL_NAMES[i]: float(v) for i, v in enumerate(p)},
            )
        )

    return ClassifyResponse(results=results)
