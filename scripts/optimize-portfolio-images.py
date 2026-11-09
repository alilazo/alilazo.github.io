"""Build smaller WebP alternatives; keep all original images as fallbacks.

Run from the repository root with Python and Pillow installed.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = {
    "pics/amado-lazo-tamucc-portrait.jpg": (512, 88),
    "pics/amado-lazo-oil-paint-portrait-overlay.png": (320, 88),
    "pics/scandinavian-minimalist-art.png": (640, 86),
    "pics/amado-lazo-new-mexico-outdoors.jpg": (960, 88),
    "pics/projects/gas-junkie-mobile-app.jpg": (1080, 88),
}
SCREENSHOTS = [
    "pics/projects/careforge-ai-platform.png",
    "pics/projects/stellar-inventory-app.png",
    "pics/projects/amadolazo-qr-code-generator.png",
    "pics/projects/comparing-ai-models.png",
    "pics/projects/mflix-movie-database.png",
    "pics/power-apps/ems-deployment-gateway-application-power-app.png",
    "pics/power-apps/ems-ra-cad-events-power-app.png",
    "pics/power-apps/ems-lecture-workshop-power-app.png",
    "pics/power-apps/ems-unit-out-of-service-power-app.png",
]


def convert(source, width, quality, lossless=False, suffix=""):
    path = ROOT / source
    target = path.with_name(path.stem + suffix + ".webp")
    with Image.open(path) as original:
        image = original.convert("RGBA" if "A" in original.getbands() else "RGB")
        if image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=quality, lossless=lossless, method=6)
    before, after = path.stat().st_size, target.stat().st_size
    if after >= before:
        target.relative_to(ROOT)
        target.unlink()
        return {"source": source, "target": source, "before": before, "after": before}
    return {"source": source, "target": target.relative_to(ROOT).as_posix(), "before": before, "after": after}


if __name__ == "__main__":
    results = [convert(source, *settings) for source, settings in PHOTOS.items()]
    results += [convert(source, 1280, 90, lossless=True) for source in SCREENSHOTS]
    convert("pics/amado-lazo-new-mexico-outdoors.jpg", 480, 86, suffix="-480")
    print(json.dumps({"images": results, "before": sum(item["before"] for item in results),
                      "after": sum(item["after"] for item in results)}, indent=2))
