// Recorta as margens transparentes da arte do logo e salva public/logo.png.
// Uso: node scripts/trim-logo.cjs
const sharp = require("sharp");

const SRC = "public/M&M Distribuidora Suzano.png";
const OUT = "public/logo.png";

sharp(SRC)
  .trim()
  .toFile(OUT)
  .then((info) => console.log(`OK ${OUT} ${info.width}x${info.height}`))
  .catch((e) => {
    console.error("ERR", e.message);
    process.exit(1);
  });
