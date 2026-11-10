/* global window */
/**
 * Measures the production build the way the performance budget is written: Lighthouse mobile defaults, three runs
 * per route, the median kept. Start the app first (`next start -p 4805`) with TMDB pointing at the mock
 * (`MOCK_TMDB_POSTERS=1 node e2e/mock-tmdb/server.ts`) so runs are repeatable.
 *
 *   node scripts/measure-performance.mjs <label> [baseUrl]
 *
 * Writes docs/perf/<label>/<route>.json (the median Lighthouse run), summary.json and the infinite scroll and
 * poster counts. MOVIE_ID picks the movie page (defaults to the mock's id).
 */
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const label = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:4805";
const movieId = process.env.MOVIE_ID ?? "1";
if (!label) throw new Error("Pass a label, for example: node scripts/measure-performance.mjs before");

const RUNS = 3;
const DEBUG_PORT = 9335;
const outDir = path.resolve(import.meta.dirname, "..", "docs", "perf", label);
mkdirSync(outDir, { recursive: true });

const only = process.env.ONLY?.split(",");
const allRoutes = [
    { name: "home", path: "/en" },
    { name: "search", path: "/en/search?q=dune" },
    { name: "movie", path: `/en/movie/${movieId}` },
    { name: "watchlist", path: "/en/watchlist" },
];

const seededItems = Array.from({ length: 80 }, (_, i) => ({
    id: 1000 + i,
    mediaType: "movie",
    title: `Seeded title ${String(i + 1)}`,
    posterPath: null,
    releaseDate: "2021-09-15",
    status: ["to-watch", "watching", "watched"][i % 3],
    rating: null,
    note: "",
    addedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
    runtime: null,
}));

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;
const round = (value, digits = 0) => Number(value.toFixed(digits));

function summarise(lhr) {
    const requests = lhr.audits["network-requests"].details.items.filter((item) => item.statusCode === 200 || item.statusCode === 304);
    const sum = (type) =>
        requests.filter((item) => item.resourceType === type).reduce((total, item) => total + (item.transferSize ?? 0), 0);
    return {
        performance: round(lhr.categories.performance.score * 100),
        jsGzipKb: round(sum("Script") / 1000, 1),
        cssGzipKb: round(sum("Stylesheet") / 1000, 1),
        requests: lhr.audits["network-requests"].details.items.length,
        lcpMs: round(lhr.audits["largest-contentful-paint"].numericValue),
        cls: round(lhr.audits["cumulative-layout-shift"].numericValue, 3),
        tbtMs: round(lhr.audits["total-blocking-time"].numericValue),
    };
}

/** A fresh browser per run, so every run is a cold load with an empty HTTP cache and the watchlist seeded. */
async function launchSeeded() {
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${String(DEBUG_PORT)}`] });
    const page = await (browser.contexts()[0] ?? (await browser.newContext())).newPage();
    // The manifest is a tiny document on the same origin that loads none of the app's chunks, so the cache stays cold.
    await page.goto(`${baseUrl}/manifest.webmanifest`);
    await page.evaluate((items) => {
        window.localStorage.setItem("watchlist:v1", JSON.stringify({ version: 1, items }));
    }, seededItems);
    await page.close();
    return browser;
}

async function measureRoute(route) {
    const runs = [];
    for (let run = 0; run < RUNS; run += 1) {
        const browser = await launchSeeded();
        try {
            const result = await lighthouse(`${baseUrl}${route.path}`, {
                port: DEBUG_PORT,
                output: "json",
                onlyCategories: ["performance"],
                disableStorageReset: true,
                logLevel: "error",
            });
            if (!result) throw new Error(`Lighthouse returned nothing for ${route.path}`);
            runs.push({ lhr: result.lhr, summary: summarise(result.lhr) });
        } finally {
            await browser.close();
        }
    }
    runs.sort((a, b) => a.summary.performance - b.summary.performance);
    const middle = runs[Math.floor(runs.length / 2)];
    writeFileSync(path.join(outDir, `${route.name}.json`), JSON.stringify(middle.lhr));
    return {
        ...middle.summary,
        medianOf: {
            performance: median(runs.map((r) => r.summary.performance)),
            cls: median(runs.map((r) => r.summary.cls)),
            lcpMs: median(runs.map((r) => r.summary.lcpMs)),
            tbtMs: median(runs.map((r) => r.summary.tbtMs)),
            jsGzipKb: median(runs.map((r) => r.summary.jsGzipKb)),
        },
    };
}

const RESULT_ITEMS = "section[aria-labelledby=search-results] li";
const CARDS = `${RESULT_ITEMS}:not([aria-hidden])`;

/** Scrolls the search page to the end on a phone and totals the layout shifts, which Lighthouse never triggers. */
async function measureInfiniteScroll(browser, mode) {
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
        window.__shifts = [];
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) window.__shifts.push(entry.value);
            }
        }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${baseUrl}/en/search?q=dune`, { waitUntil: "networkidle" });
    await page.locator(RESULT_ITEMS).first().waitFor();
    await page.waitForTimeout(500);
    const sum = () => page.evaluate(() => window.__shifts.reduce((a, b) => a + b, 0));
    const before = await sum();
    let appended = 0;
    let known = await page.locator(CARDS).count();
    if (mode === "jump") {
        // End key or a dragged scrollbar: straight to the bottom, then wait for the next page.
        for (let step = 0; step < 4; step += 1) {
            await page.evaluate(() => {
                window.scrollTo(0, window.document.documentElement.scrollHeight);
            });
            await page.waitForTimeout(1500);
            const count = await page.locator(CARDS).count();
            if (count > known) appended += 1;
            known = count;
        }
    } else {
        // Scroll the way a thumb does, in small steps, so the next page is requested as its placeholders near the screen.
        for (let step = 0; step < 600 && appended < 4; step += 1) {
            await page.evaluate(() => {
                window.scrollBy(0, 250);
            });
            await page.waitForTimeout(40);
            const count = await page.locator(CARDS).count();
            if (count > known) {
                appended += 1;
                known = count;
                await page.waitForTimeout(500);
            }
        }
    }
    const total = await sum();
    const cards = await page.locator(CARDS).count();
    await context.close();
    return {
        initialCls: round(before, 3),
        totalCls: round(total, 3),
        appendedCls: round(total - before, 3),
        appendedPages: appended,
        clsPerAppendedPage: appended ? round((total - before) / appended, 3) : 0,
        cardsAfterScroll: cards,
    };
}

/** Counts the poster requests the home page makes on a 1280 px desktop and the widths it asks for. */
async function measureHomePosters(browser) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const urls = [];
    page.on("request", (request) => {
        if (request.url().includes("/_next/image")) urls.push(request.url());
    });
    await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle" });
    const widths = urls.map((url) => Number(new URL(url).searchParams.get("w")));
    const images = await page
        .locator("img")
        .evaluateAll((nodes) => nodes.map((node) => ({ loading: node.loading, priority: node.fetchPriority })));
    await context.close();
    return {
        posterRequests: urls.length,
        widthsRequested: [...new Set(widths)].sort((a, b) => a - b),
        imgElements: images.length,
        eagerImgs: images.filter((image) => image.loading === "eager").length,
        highPriorityImgs: images.filter((image) => image.priority === "high").length,
    };
}

const browser = await chromium.launch();
try {
    const summary = { label, baseUrl, runs: RUNS, routes: {} };
    for (const route of allRoutes.filter((candidate) => !only || only.includes(candidate.name))) {
        summary.routes[route.name] = await measureRoute(route);
        console.log(route.name, JSON.stringify(summary.routes[route.name]));
    }
    if (!only || only.includes("scroll"))
        summary.infiniteScroll = {
            steps: await measureInfiniteScroll(browser, "steps"),
            jump: await measureInfiniteScroll(browser, "jump"),
        };
    if (!only || only.includes("posters")) summary.homePosters = await measureHomePosters(browser);
    if (summary.infiniteScroll) console.log("scroll", JSON.stringify(summary.infiniteScroll));
    if (summary.homePosters) console.log("posters", JSON.stringify(summary.homePosters));
    writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
} finally {
    await browser.close();
}
