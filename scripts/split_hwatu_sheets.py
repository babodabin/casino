from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "hwatu-cards"
OUT.mkdir(exist_ok=True)

sources = {
    1: "hwatu-month-01-v2.png", 2: "hwatu-month-02-v2.png",
    3: "hwatu-month-03.png", 4: "hwatu-month-04.png",
    5: "hwatu-month-05-v2.png", 6: "hwatu-month-06-v2.png",
    7: "hwatu-month-07.png", 8: "hwatu-month-08-v2.png",
    9: "hwatu-month-09-v2.png", 10: "hwatu-month-10.png",
    11: "hwatu-month-11-v2.png", 12: "hwatu-month-12-v2.png",
}

for month, filename in sources.items():
    image = Image.open(ASSETS / filename).convert("RGBA")
    width, height = image.size
    # 생성된 시트는 항상 같은 폭의 네 칸으로 구성됩니다. 칸 중앙을 기준으로
    # 나누면 카드 사이 여백을 보존하면서 이웃 카드가 섞이지 않습니다.
    for position in range(4):
        left = round(width * position / 4)
        right = round(width * (position + 1) / 4)
        card = image.crop((left, 0, right, height))
        card.thumbnail((430, 720), Image.Resampling.LANCZOS)
        card.save(OUT / f"m{month:02d}-{position}.png", optimize=True)

print(f"saved {len(list(OUT.glob('m??-?.png')))} cards to {OUT}")
