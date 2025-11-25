import fs from "node:fs/promises";
import path from "node:path";
import { parseString as parseCsv } from "@fast-csv/parse";
import AdmZip from "adm-zip";

const OBSTACLE_ZIP_URL =
    "https://aro.lfv.se/Editorial/View/General/15776/LFV_OBSTACLE_DATASET_AREA1_WEF_20251030.zip";

main().catch(console.error);
async function main() {
    const csvData = await getCsvData();
    const obstacles = await Array.fromAsync(parseObstacles(csvData));
    const outPath = path.join(__dirname, "public", "obstacles.json");
    await fs.writeFile(outPath, JSON.stringify(obstacles));
    console.log(`Wrote ${obstacles.length} objects to ${outPath}.`);
}

async function getCsvData() {
    const response = await fetch(OBSTACLE_ZIP_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch ZIP: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.bytes());
    const zip = new AdmZip(buffer);
    const csvEntry = zip.getEntries().find(e => e.entryName.endsWith(".csv"));
    if (!csvEntry) {
        throw new Error("No CSV file found in ZIP archive");
    }
    return csvEntry.getData().toString("utf-8");
}

async function* parseObstacles(csvData: string) {
    for await (const obj of parseCsv(csvData, { delimiter: ";", headers: true })) {
        yield {
            name: obj["NAME"],
            lat: parseCoordinate(obj["LATITUDE"]),
            long: parseCoordinate(obj["LONGITUDE"]),
            height: parseHeight(obj["HEIGHT"]),
            type: obj["OBSTACLE_TYPE"],
        };
    }
}

/** Parses a coordinate on the format used in the CSV file (deg, min, sec) into numeric degrees with four decimals. */
function parseCoordinate(str: string) {
    const match = /^(\d{2,3})(\d{2})(\d{2}\.\d)[EN]$/.exec(str);
    if (!match) {
        throw new Error(`Failed to parse coordinate: ${JSON.stringify(str)}`);
    }
    const [, deg, min, sec] = match.map(Number);
    return Math.round((deg + min / 60 + sec / 3600) * 10000) / 10000;
}

/** Parses a textual height in feet into a numeric height in meters. */
function parseHeight(feet: string) {
    const meters = Number(feet) * 0.3048;
    if (!Number.isFinite(meters)) {
        throw new Error(`Failed to parse height: ${JSON.stringify(feet)}`);
    }
    return Math.round(meters);
}
