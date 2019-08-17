import { writeFileSync } from "fs";
import fetch from "node-fetch";
import * as path from "path";

const OBSTACLE_CSV_URL = "https://aro.lfv.se/Editorial/View/6391/ES_ENR_5_4_WEF_20190815";

main().catch(console.error);
async function main() {
    const response = await fetch(OBSTACLE_CSV_URL);
    const csvText = (await response.buffer()).toString("latin1");
    const obstacles = csvText
        .split("\n")
        .map(line => line.trimRight().split(";"))
        .filter(cells => cells.length === 9 && cells[0] !== "NO")
        .map(([, name, lat, long, , heightFt, , , type]) => ({
            name,
            lat: parseCoordinate(lat),
            long: parseCoordinate(long),
            height: parseHeight(heightFt),
            type,
        }));
    const outPath = path.resolve(__dirname, "public", "obstacles.json");
    writeFileSync(outPath, JSON.stringify(obstacles));
    console.log(`Wrote ${obstacles.length} objects to ${outPath}.`);
}

function parseCoordinate(str: string) {
    const match = /^(\d{2,3})(\d{2})(\d{2}\.\d)[EN]$/.exec(str);
    if (!match) {
        throw new Error(`Failed to parse coordinate: ${JSON.stringify(str)}`);
    }
    const [, deg, min, sec] = match.map(parseFloat);
    return Math.round((deg + min / 60 + sec / 3600) * 10000) / 10000;
}

function parseHeight(feet: string) {
    const meters = parseFloat(feet) * 0.3048;
    if (!Number.isFinite(meters)) {
        throw new Error(`Failed to parse height: ${JSON.stringify(feet)}`);

    }
    return Math.round(meters);
}
