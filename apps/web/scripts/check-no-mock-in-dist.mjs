import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

if (!fs.existsSync(distDir)) {
  console.error("Error: apps/web/dist does not exist. Run 'pnpm --filter web build' first.");
  process.exit(1);
}

const FORBIDDEN_STRINGS = [
  "Minh Anh",
  "minhanh@gmail.com",
  "Chuỗi 4 ngày",
  "Phát âm 7.0",
  "Trả lời trôi chảy, có mở rộng ý",
  "128 từ/phút",
];

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsFiles = getAllJsFiles(distDir);
let foundErrors = false;

for (const filePath of jsFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      console.error(`Mock string "${forbidden}" found in ${path.relative(distDir, filePath)}`);
      foundErrors = true;
    }
  }
}

if (foundErrors) {
  process.exit(1);
}

console.log("OK: no mock markers in dist");
