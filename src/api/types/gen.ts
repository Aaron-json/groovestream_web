import { PRIMARY_API_DEV_URL } from "../api";
import openapiTS, { astToString } from "openapi-typescript";
import fs from "node:fs";
import url from "node:url";
import path from "node:path";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function genTypes() {
  const ast = await openapiTS(PRIMARY_API_DEV_URL + "/openapi.json");
  const output = astToString(ast);

  fs.writeFileSync(path.join(__dirname, "schema.ts"), output);
}

genTypes().catch(console.error);
