"""
Recortes sin fondo para la imagen de las TARJETAS del grid (Maison Eternelle).

La página de detalle no se toca: siempre muestra la foto original. Las fotos
de fondo blanco tampoco necesitan recorte (en modo claro el CSS las funde con
la tarjeta, ver mix-blend-mode en output.css). Esta herramienta es para las
fotos ambientadas (escenas) y las de fondo claro no blanco.

Pasos (desde tools/card-cutouts/, con el venv del README):
  python cutouts.py classify   qué fotos necesitan recorte y cuáles falta decidir
  python cutouts.py masks      paso LENTO: máscara BiRefNet de las pendientes (reanudable)
  python cutouts.py compose    arma las versiones "full" y "main" desde las máscaras
  python cutouts.py review     hojas de revisión en work/review/
  -> editar decisions.json: aprobar (variante "main" o "full") o rechazar (motivo)
  python cutouts.py publish    copia las aprobadas al sitio y regenera js/cardImages.js

Opciones de masks/compose/review: --only TEXTO (filtra por nombre o URL,
incluye ya decididas), --all (todas las candidatas, no solo pendientes).
"""
import argparse
import hashlib
import io
import json
import re
import sys
import time
import urllib.request
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SITE = REPO / "ejercicio_web"
PREVIEWS = SITE / "assets" / "previews"
CARD_JS = SITE / "js" / "cardImages.js"
DECISIONS = HERE / "decisions.json"
WORK = HERE / "work"
CACHE = HERE / ".cache"
MODEL = CACHE / "birefnet-lite.onnx"

API = "https://maison-backend-7pq8.onrender.com/api/v1"
# BiRefNet "general lite" (licencia MIT) en ONNX, de las releases de rembg (MIT).
MODEL_URL = (
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/"
    "BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx"
)
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
KEEP_RATIO = 0.30  # "main": conserva objetos con área >= 30% del mayor
CARD_LIGHT, CARD_DARK = (250, 247, 243), (26, 26, 26)  # --card-bg claro / oscuro


# ── utilidades ──────────────────────────────────────────────────────────────
def get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "maison-card-cutouts"})
    return urllib.request.urlopen(req, timeout=timeout).read()


def slug_for(url):
    """Mismo nombre de archivo que la primera generación (2026-09-26)."""
    base = re.sub(r"\.[a-z0-9]+$", "", url.rsplit("/", 1)[-1], flags=re.I)
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:48]
    return f"{base}-{hashlib.sha1(url.encode()).hexdigest()[:6]}"


def flatten_white(img):
    img = img.convert("RGBA")
    return Image.alpha_composite(Image.new("RGBA", img.size, (255, 255, 255, 255)), img).convert("RGB")


def load_decisions():
    d = json.loads(DECISIONS.read_text(encoding="utf-8"))
    return d.setdefault("approved", {}), d.setdefault("rejected", {}), d


def state_of(url, approved, rejected):
    return "aprobada" if url in approved else "rechazada" if url in rejected else "pendiente"


# ── clasificación del fondo ─────────────────────────────────────────────────
def classify_bytes(raw):
    """transparente | blanco | claro | escena, mirando un borde de píxeles."""
    a = np.asarray(Image.open(io.BytesIO(raw)).convert("RGBA"))
    h, w = a.shape[:2]
    step = max(1, min(w, h) // 60)
    inset = max(1, int(min(w, h) * 0.01))
    border = np.concatenate([
        a[inset, ::step], a[h - 1 - inset, ::step], a[::step, inset], a[::step, w - 1 - inset],
    ]).astype(int)
    alpha = border[:, 3]
    if (alpha < 20).mean() > 0.6:
        return "transparente"
    rgb = border[alpha >= 20][:, :3]
    if len(rgb) == 0:
        return "transparente"
    lo, hi = rgb.min(axis=1), rgb.max(axis=1)
    if ((lo >= 238) & (hi - lo <= 12)).mean() > 0.9:
        return "blanco"
    if (lo >= 200).mean() > 0.85:
        return "claro"
    return "escena"


def candidates(refresh=False):
    """Fotos principales en producción cuyo fondo necesita recorte."""
    WORK.mkdir(exist_ok=True)
    cache_file = WORK / "classify.json"
    cache = json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() and not refresh else {}
    products = json.loads(get(f"{API}/products?limit=1000"))["data"]
    out = []
    for p in products:
        url = p.get("image")
        if not url:
            continue
        if url not in cache:
            cache[url] = classify_bytes(get(url))
        if cache[url] in ("escena", "claro"):
            out.append({"id": p["id"], "name": p["name"], "url": url, "bg": cache[url], "slug": slug_for(url)})
    cache_file.write_text(json.dumps(cache, indent=1), encoding="utf-8")
    return out, products


def select(args, cands, approved, rejected):
    if args.only:
        t = args.only.lower()
        return [c for c in cands if t in c["name"].lower() or t in c["url"].lower()]
    if args.all:
        return cands
    return [c for c in cands if state_of(c["url"], approved, rejected) == "pendiente"]


# ── modelo ──────────────────────────────────────────────────────────────────
def session():
    import onnxruntime as ort  # import tardío: classify/publish no lo necesitan

    if not MODEL.exists():
        CACHE.mkdir(exist_ok=True)
        print(f"Descargando el modelo BiRefNet (~214 MB) en {MODEL} ...", flush=True)
        MODEL.write_bytes(get(MODEL_URL, timeout=600))
    return ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])


def predict_mask(sess, rgb):
    x = np.asarray(rgb.resize((1024, 1024), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None].astype(np.float32)
    out = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    pred = 1 / (1 + np.exp(-out))
    pred = (pred - pred.min()) / max(pred.max() - pred.min(), 1e-6)
    return Image.fromarray((pred * 255).astype(np.uint8), mode="L").resize(rgb.size, Image.Resampling.LANCZOS)


# ── composición ─────────────────────────────────────────────────────────────
def keep_map(mask):
    """Componentes conexas sobre una versión chica de la máscara: deja solo
    los objetos grandes (botella, caja) y descarta adornos sueltos."""
    w, h = mask.size
    scale = 256 / max(w, h)
    sw, sh = max(1, int(w * scale)), max(1, int(h * scale))
    small = np.asarray(mask.resize((sw, sh), Image.Resampling.BILINEAR)) > 128
    labels = np.zeros(small.shape, dtype=np.int32)
    areas = [0]
    cur = 0
    for y in range(sh):
        for x in range(sw):
            if small[y, x] and not labels[y, x]:
                cur += 1
                area = 0
                q = deque([(y, x)])
                labels[y, x] = cur
                while q:
                    cy, cx = q.popleft()
                    area += 1
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = cur
                            q.append((ny, nx))
                areas.append(area)
    if cur == 0:
        return Image.new("L", mask.size, 255), 0, 0
    biggest = max(areas[1:])
    keep_ids = [i for i in range(1, cur + 1) if areas[i] >= KEEP_RATIO * biggest]
    keep = np.isin(labels, keep_ids)
    for _ in range(2):  # dilatar 2px para no comerse bordes suaves
        k = keep.copy()
        k[1:, :] |= keep[:-1, :]
        k[:-1, :] |= keep[1:, :]
        k[:, 1:] |= keep[:, :-1]
        k[:, :-1] |= keep[:, 1:]
        keep = k
    km = Image.fromarray((keep * 255).astype(np.uint8), mode="L").resize(mask.size, Image.Resampling.BILINEAR)
    return km, len(keep_ids), cur


def finish(rgb, alpha):
    """Recorta al sujeto y lo centra en un cuadrado con 12% de aire, máx 700px."""
    rgba = rgb.copy()
    rgba.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 10 else 0).getbbox()
    obj = rgba.crop(bbox)
    side = int(max(obj.size) * 1.12)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(obj, ((side - obj.width) // 2, (side - obj.height) // 2))
    if side > 700:
        canvas = canvas.resize((700, 700), Image.Resampling.LANCZOS)
    return canvas


# ── comandos ────────────────────────────────────────────────────────────────
def cmd_classify(args):
    approved, rejected, _ = load_decisions()
    cands, products = candidates(refresh=args.refresh)
    with_img = sum(1 for p in products if p.get("image"))
    by_state = {}
    for c in cands:
        by_state.setdefault(state_of(c["url"], approved, rejected), []).append(c)
    print(f"Productos: {len(products)} | con foto: {with_img} | necesitan recorte (escena/fondo claro): {len(cands)}")
    for s in ("aprobada", "rechazada", "pendiente"):
        print(f"  {s}: {len(by_state.get(s, []))}")
    for c in by_state.get("pendiente", []):
        print(f"    PENDIENTE #{c['id']} {c['name']} [{c['bg']}]")
    live = {p.get("image") for p in products}
    stale = [u for u in list(approved) + list(rejected) if u not in live]
    if stale:
        print(f"\n{len(stale)} decisión(es) de fotos que ya no son la principal de ningún producto (se pueden borrar de decisions.json):")
        for u in stale:
            print(f"    {(approved.get(u) or rejected.get(u))['name']}: {u}")


def cmd_masks(args):
    approved, rejected, _ = load_decisions()
    cands, _ = candidates()
    todo = select(args, cands, approved, rejected)
    if not todo:
        print("No hay fotos pendientes. (Usa --only o --all para rehacer alguna.)")
        return
    (WORK / "src").mkdir(parents=True, exist_ok=True)
    (WORK / "masks").mkdir(parents=True, exist_ok=True)
    sess = session()
    t0 = time.time()
    for i, c in enumerate(todo, 1):
        mask_file = WORK / "masks" / f"{c['slug']}.png"
        if mask_file.exists() and not args.redo:
            print(f"[{i}/{len(todo)}] #{c['id']} ya tenía máscara", flush=True)
            continue
        rgb = flatten_white(Image.open(io.BytesIO(get(c["url"]))))
        rgb.save(WORK / "src" / f"{c['slug']}.png")
        predict_mask(sess, rgb).save(mask_file)
        print(f"[{i}/{len(todo)}] #{c['id']} {c['name'][:45]} ({time.time() - t0:.0f}s)", flush=True)
    print(f"Listo en {time.time() - t0:.0f}s")


def cmd_compose(args):
    approved, rejected, _ = load_decisions()
    cands, _ = candidates()
    todo = select(args, cands, approved, rejected)
    for d in ("full", "main"):
        (WORK / d).mkdir(parents=True, exist_ok=True)
    done = 0
    for c in todo:
        mask_file = WORK / "masks" / f"{c['slug']}.png"
        if not mask_file.exists():
            print(f"  #{c['id']} sin máscara todavía (corre 'masks' primero)")
            continue
        mask = Image.open(mask_file).convert("L")
        rgb = Image.open(WORK / "src" / f"{c['slug']}.png").convert("RGB")
        finish(rgb, mask).save(WORK / "full" / f"{c['slug']}.webp", "WEBP", quality=88, method=6)
        km, kept, total = keep_map(mask)
        main_alpha = Image.fromarray(
            (np.asarray(mask, dtype=np.uint16) * np.asarray(km, dtype=np.uint16) // 255).astype(np.uint8), mode="L"
        )
        finish(rgb, main_alpha).save(WORK / "main" / f"{c['slug']}.webp", "WEBP", quality=88, method=6)
        note = f" — 'main' descartó {total - kept} objeto(s) suelto(s)" if kept < total else ""
        print(f"  #{c['id']} {c['name'][:45]}{note}")
        done += 1
    print(f"{done} foto(s) compuestas en work/full y work/main")


def tile(img, size, bg):
    t = Image.new("RGB", (size, size), bg)
    img = img.copy()
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    if img.mode == "RGBA":
        t.paste(img, ((size - img.width) // 2, (size - img.height) // 2), img)
    else:
        t.paste(img, ((size - img.width) // 2, (size - img.height) // 2))
    return t


def cmd_review(args):
    approved, rejected, _ = load_decisions()
    cands, _ = candidates()
    todo = [c for c in select(args, cands, approved, rejected) if (WORK / "main" / f"{c['slug']}.webp").exists()]
    if not todo:
        print("Nada para revisar (¿corriste 'compose'?).")
        return
    out_dir = WORK / "review"
    out_dir.mkdir(parents=True, exist_ok=True)
    S, PAD, LABEL, PER = 200, 6, 20, 10
    for n in range(0, len(todo), PER):
        chunk = todo[n:n + PER]
        sheet = Image.new("RGB", (4 * S + 5 * PAD, len(chunk) * (S + LABEL + PAD) + PAD), (136, 136, 136))
        draw = ImageDraw.Draw(sheet)
        y = PAD
        for c in chunk:
            src = Image.open(WORK / "src" / f"{c['slug']}.png").convert("RGB")
            full = Image.open(WORK / "full" / f"{c['slug']}.webp").convert("RGBA")
            main = Image.open(WORK / "main" / f"{c['slug']}.webp").convert("RGBA")
            draw.rectangle([PAD, y, sheet.width - PAD, y + LABEL - 2], fill=(51, 51, 51))
            draw.text((PAD + 4, y + 3), f"#{c['id']} {c['name']}  [{state_of(c['url'], approved, rejected)}]", fill=(255, 255, 255))
            row = [tile(src, S, (255, 255, 255)), tile(full, S, CARD_LIGHT), tile(main, S, CARD_LIGHT), tile(main, S, CARD_DARK)]
            for i, t in enumerate(row):
                sheet.paste(t, (PAD + i * (S + PAD), y + LABEL))
            y += LABEL + S + PAD
        name = out_dir / f"review-{n // PER + 1}.png"
        sheet.save(name)
        print(f"{name}  ({len(chunk)} fotos: original | full sobre tarjeta clara | main clara | main oscura)")


def cmd_publish(args):
    approved, rejected, _ = load_decisions()
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    entries, missing, updated = [], [], 0
    for url, info in approved.items():
        slug = slug_for(url)
        variant = info.get("variant", "main")
        built = WORK / variant / f"{slug}.webp"
        target = PREVIEWS / f"{slug}.webp"
        if built.exists():
            if not target.exists() or built.read_bytes() != target.read_bytes():
                target.write_bytes(built.read_bytes())
                updated += 1
        elif not target.exists():
            missing.append(info["name"])
            continue
        entries.append((info["name"], url, f"assets/previews/{slug}.webp"))
    keep = {Path(p).name for _, _, p in entries}
    removed = [f.name for f in PREVIEWS.glob("*.webp") if f.name not in keep]
    for name in removed:
        (PREVIEWS / name).unlink()

    entries.sort()
    js = CARD_JS.read_text(encoding="utf-8")
    head, _, tail = js.partition("const CARD_IMAGES = ")
    tail = tail[tail.index("export function"):]
    lines = ["const CARD_IMAGES = {"]
    for name, url, path in entries:
        lines.append(f"  // {name}")
        lines.append(f"  {json.dumps(url, ensure_ascii=False)}: {json.dumps(path)},")
    lines.append("};\n\n")
    # Respetar los finales de línea que ya tiene el archivo (en Windows git
    # deja la copia de trabajo en CRLF): si no, git lo marca como modificado
    # aunque el contenido sea idéntico.
    eol = "\r\n" if b"\r\n" in CARD_JS.read_bytes() else "\n"
    CARD_JS.write_text(head + "\n".join(lines) + tail, encoding="utf-8", newline=eol)

    total_kb = sum((PREVIEWS / Path(p).name).stat().st_size for _, _, p in entries) // 1024
    print(f"{len(entries)} recortes en el sitio ({total_kb} KB) | actualizados: {updated} | borrados: {len(removed)}")
    if missing:
        print("Aprobadas sin archivo (corre masks + compose para ellas):", ", ".join(missing))
        sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("classify")
    p.add_argument("--refresh", action="store_true", help="volver a clasificar todas las fotos")
    for name in ("masks", "compose", "review"):
        p = sub.add_parser(name)
        p.add_argument("--only", help="filtrar por texto en el nombre o la URL (incluye ya decididas)")
        p.add_argument("--all", action="store_true", help="todas las candidatas, no solo pendientes")
        if name == "masks":
            p.add_argument("--redo", action="store_true", help="recalcular aunque ya exista la máscara")
    sub.add_parser("publish")
    args = ap.parse_args()
    {"classify": cmd_classify, "masks": cmd_masks, "compose": cmd_compose, "review": cmd_review, "publish": cmd_publish}[args.cmd](args)


if __name__ == "__main__":
    main()
