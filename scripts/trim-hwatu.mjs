// ⚠️ 이 스크립트는 이제 쓰지 마세요.
// 2026-08-30에 화투패를 새 그림으로 바꾸면서 48장을 전부 150x225로 통일했습니다.
// 이걸 다시 돌리면 그림마다 여백을 다시 잘라내서 크기가 또 제각각이 됩니다.
// 그게 예전에 화투패가 보기 싫었던 바로 그 원인입니다.
// 새 그림을 넣는 방법은 TODO.md의 화투패 항목을 보세요.

// 화투 카드 그림에서 흰 여백을 잘라냅니다.
//
// 지금 그림은 한 달치 넉 장이 가로로 붙은 큰 그림을 잘라 만든 것인데, 자른 위치가 제각각이라
// 카드마다 흰 여백이 남아 있습니다(어떤 것은 세로의 30%가 흰색). 그 흰색이 그림 안에 들어가
// 있어서 화면에서 색을 바꿔도 없어지지 않습니다.
//
// 이 스크립트는 카드마다 실제 그림이 시작하는 곳을 찾아 잘라내고,
// 카드 틀 비율(2:3)에 맞게 투명한 여백을 대칭으로 붙여 크기를 통일합니다.
// 그래야 카드마다 크기가 들쭉날쭉하지 않습니다.
//
// pngjs가 필요합니다. 저장소에는 넣지 않고 한 번만 따로 설치해서 씁니다.
//   npm install pngjs --prefix <저장소 밖 아무 폴더>
//   node scripts/trim-hwatu.mjs <그 폴더>/node_modules/pngjs
//
// 결과 파일이 저장소에 커밋되므로 배포에는 이 의존성이 필요 없습니다.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const DIR = 'assets/hwatu-cards';
/** 카드 틀 비율. App.tsx의 hwatuCard가 52×78이라 2:3입니다. */
const TARGET_RATIO = 52 / 78;
/** 이보다 밝으면 흰 여백으로 봅니다. */
const WHITE = 235;
/** 한 줄에서 이 비율 이상이 흰색이면 그 줄을 여백으로 봅니다. */
const ROW_WHITE = 0.92;

const pngjsPath = process.argv[2];
if (!pngjsPath) {
  console.error('pngjs 경로를 인자로 주세요. 예) node scripts/trim-hwatu.mjs C:/tmp/pngtool/node_modules/pngjs');
  process.exit(1);
}
const require = createRequire(import.meta.url);
const { PNG } = require(pngjsPath);

const at = (png, x, y) => (y * png.width + x) * 4;
const isWhite = (png, x, y) => {
  const o = at(png, x, y);
  // 투명한 곳은 여백으로 봅니다.
  if (png.data[o + 3] < 16) return true;
  return png.data[o] > WHITE && png.data[o + 1] > WHITE && png.data[o + 2] > WHITE;
};

function contentBox(png) {
  const rowWhite = (y) => { let n = 0; for (let x = 0; x < png.width; x += 1) if (isWhite(png, x, y)) n += 1; return n / png.width; };
  const colWhite = (x) => { let n = 0; for (let y = 0; y < png.height; y += 1) if (isWhite(png, x, y)) n += 1; return n / png.height; };
  let left = 0, right = png.width - 1, top = 0, bottom = png.height - 1;
  while (left < right && colWhite(left) >= ROW_WHITE) left += 1;
  while (right > left && colWhite(right) >= ROW_WHITE) right -= 1;
  while (top < bottom && rowWhite(top) >= ROW_WHITE) top += 1;
  while (bottom > top && rowWhite(bottom) >= ROW_WHITE) bottom -= 1;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** 잘라낸 그림을 카드 비율에 맞게 투명 여백을 붙여 키웁니다. */
function padToRatio(png, box) {
  let width = box.width, height = box.height;
  if (width / height > TARGET_RATIO) height = Math.round(width / TARGET_RATIO);
  else width = Math.round(height * TARGET_RATIO);
  const out = new PNG({ width, height });
  out.data.fill(0);
  const offsetX = Math.floor((width - box.width) / 2);
  const offsetY = Math.floor((height - box.height) / 2);
  for (let y = 0; y < box.height; y += 1) {
    for (let x = 0; x < box.width; x += 1) {
      const from = at(png, box.left + x, box.top + y);
      const to = at(out, offsetX + x, offsetY + y);
      out.data[to] = png.data[from];
      out.data[to + 1] = png.data[from + 1];
      out.data[to + 2] = png.data[from + 2];
      out.data[to + 3] = png.data[from + 3];
    }
  }
  return out;
}

const files = readdirSync(DIR).filter((name) => name.endsWith('.png')).sort();
let changed = 0;
for (const name of files) {
  const path = join(DIR, name);
  const png = PNG.sync.read(readFileSync(path));
  const box = contentBox(png);
  const trimmed = png.width - box.width + (png.height - box.height);
  const out = padToRatio(png, box);
  writeFileSync(path, PNG.sync.write(out));
  if (trimmed > 0) changed += 1;
  console.log(`${name}  ${png.width}x${png.height} → ${out.width}x${out.height}  (잘라낸 흰 여백 가로 ${png.width - box.width}, 세로 ${png.height - box.height})`);
}
console.log(`\n${files.length}장 중 ${changed}장에서 흰 여백을 잘라냈습니다.`);
