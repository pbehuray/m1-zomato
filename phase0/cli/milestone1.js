#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function loadDotEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvFile(path.join(repoRoot, ".env"));

function printHelp() {
  console.log(
    [
      "milestone1 <command>",
      "",
      "Commands:",
      "  info         Show project info (Phase 0+)",
      "  doctor       Run local environment checks",
      "  ingest-smoke Fetch + normalize a small dataset slice (Phase 1)",
      "  prefs-parse  Parse and validate user preferences (Phase 2)",
      "  integrate    Test integration layer with preferences (Phase 3)",
      "  recommend    Get LLM recommendations (Phase 4)",
      "",
      "Examples:",
      "  node phase0/cli/milestone1.js info",
      "  node phase0/cli/milestone1.js doctor",
      "  node phase0/cli/milestone1.js ingest-smoke --limit 10",
      "  node phase0/cli/milestone1.js ingest-smoke --all",
      "  node phase0/cli/milestone1.js prefs-parse --location Bangalore --budget medium --cuisines \"North Indian,Chinese\" --rating 4",
      "  node phase0/cli/milestone1.js integrate --location Bangalore --budget medium --cuisines \"North Indian,Chinese\" --rating 4",
      "  node phase0/cli/milestone1.js recommend --location Banashankari --budget low --cuisines \"South Indian\" --rating 3.5",
    ].join("\n"),
  );
}

function readText(relPath) {
  const abs = path.join(repoRoot, relPath);
  return fs.readFileSync(abs, "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function cmdInfo() {
  const datasetId =
    process.env.HF_DATASET_ID || "ManikaSaini/zomato-restaurant-recommendation";

  console.log("Milestone 1");
  console.log("");
  console.log(`- Dataset: ${datasetId}`);
  console.log(`- Docs: ${path.join("docs", "problemstatement.md")}`);
  console.log(`- Architecture: ${path.join("docs", "phase-wise-architecture.md")}`);
  console.log(`- Edge cases: ${path.join("docs", "edge-cases.md")}`);

  const scopeExists = exists(path.join("docs", "phase0-scope.md"));
  const contractExists = exists(path.join("docs", "dataset-contract.md"));
  console.log("");
  console.log("Phase 0 artifacts:");
  console.log(`- docs/phase0-scope.md: ${scopeExists ? "OK" : "MISSING"}`);
  console.log(`- docs/dataset-contract.md: ${contractExists ? "OK" : "MISSING"}`);
  console.log(`- .env.example: ${exists(".env.example") ? "OK" : "MISSING"}`);
  console.log("");
  console.log("Phase 1 artifacts:");
  console.log(
    `- phase1/ingestion/: ${exists(path.join("phase1", "ingestion", "index.js")) ? "OK" : "MISSING"}`,
  );
}

function cmdDoctor() {
  const results = [];

  // Node version
  results.push({
    check: "Node.js available",
    ok: typeof process.version === "string",
    detail: process.version,
  });

  // Docs presence
  for (const rel of [
    "docs/problemstatement.md",
    "docs/phase-wise-architecture.md",
    "docs/edge-cases.md",
    "docs/phase0-scope.md",
    "docs/dataset-contract.md",
    "phase1/ingestion/index.js",
  ]) {
    results.push({
      check: `Exists: ${rel}`,
      ok: exists(rel),
      detail: exists(rel) ? "present" : "missing",
    });
  }

  // Secrets template / env
  const envExampleOk = exists(".env.example");
  const envOk = exists(".env");
  results.push({
    check: "Secrets template (.env.example)",
    ok: envExampleOk,
    detail: envExampleOk ? "present" : "missing",
  });
  results.push({
    check: "Local env file (.env) [optional for Phase 0]",
    ok: true,
    detail: envOk ? "present" : "not found (ok for Phase 0)",
  });

  // LLM env readiness (informational)
  const provider = process.env.LLM_PROVIDER || "openai";
  const openAiKeySet = Boolean(process.env.OPENAI_API_KEY);
  results.push({
    check: "LLM provider configured (Phase 4 readiness)",
    ok: true,
    detail: `LLM_PROVIDER=${provider}`,
  });
  results.push({
    check: "OPENAI_API_KEY set (Phase 4 readiness)",
    ok: true,
    detail:
      provider !== "openai"
        ? "not required for non-openai provider"
        : openAiKeySet
          ? "set"
          : "not set (ok until Phase 4)",
  });

  // Print report
  const pad = (s, n) => (s.length >= n ? s : s + " ".repeat(n - s.length));
  const width = Math.max(...results.map((r) => r.check.length)) + 2;
  let failed = 0;

  console.log("milestone1 doctor");
  console.log("");

  for (const r of results) {
    const status = r.ok ? "OK" : "FAIL";
    if (!r.ok) failed += 1;
    console.log(`${pad(r.check, width)} ${status}  ${r.detail}`);
  }

  console.log("");
  if (failed > 0) {
    console.log(`Doctor found ${failed} failing check(s).`);
    process.exitCode = 1;
  } else {
    console.log("All checks passed.");
  }
}

function parseFlagValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  const v = args[idx + 1];
  if (!v || v.startsWith("-")) return null;
  return v;
}

async function cmdIngestSmoke(args) {
  const datasetId =
    process.env.HF_DATASET_ID || "ManikaSaini/zomato-restaurant-recommendation";
  const config = process.env.HF_DATASET_CONFIG || null;
  const split = process.env.HF_DATASET_SPLIT || null;

  const all = args.includes("--all");
  const limitRaw = parseFlagValue(args, "--limit") ?? "10";
  const parsedLimit = Number(limitRaw);
  if (!all && !Number.isFinite(parsedLimit)) {
    console.error(`Invalid --limit value: ${limitRaw}`);
    process.exitCode = 2;
    return;
  }
  const limit = all ? Infinity : Math.max(1, Math.min(200000, parsedLimit));

  const { loadRestaurants } = await import(
    pathToFileURL(path.join(repoRoot, "phase1", "ingestion", "index.js")).href
  );

  console.log("milestone1 ingest-smoke");
  console.log("");
  console.log(`- dataset: ${datasetId}`);
  if (config) console.log(`- config (env): ${config}`);
  if (split) console.log(`- split (env): ${split}`);
  console.log(`- limit: ${all ? "ALL" : String(limit)}`);
  console.log("");

  const t0 = Date.now();
  const result = await loadRestaurants({
    repoRoot,
    datasetId,
    config: config || undefined,
    split: split || undefined,
    limit,
  });
  const ms = Date.now() - t0;

  console.log(
    `Loaded ${result.restaurants.length} restaurant(s) from config=${result.config}, split=${result.split} in ${ms}ms`,
  );
  console.log(`Cache: ${result.cachePath}`);

  const sample = result.restaurants.slice(0, Math.min(5, result.restaurants.length));
  if (sample.length > 0) {
    console.log("");
    console.log("Sample:");
    for (const r of sample) {
      const cuisines = r.cuisines.slice(0, 3).join(", ");
      console.log(
        `- ${r.name} | ${r.location ?? "Unknown location"} | rating=${r.rating ?? "?"} | cost=${r.cost ?? "?"} | cuisines=${cuisines || "?"}`,
      );
    }
  }
}

async function cmdPrefsParse(args) {
  console.log("milestone1 prefs-parse");
  console.log("");

  const { preferencesFromCLI, validateLocationWithSuggestions } = await import(
    pathToFileURL(path.join(repoRoot, "phase2", "preferences", "index.js")).href
  );

  const location = parseFlagValue(args, "--location");
  const budget = parseFlagValue(args, "--budget");
  const cuisines = parseFlagValue(args, "--cuisines");
  const rating = parseFlagValue(args, "--rating");
  const notes = parseFlagValue(args, "--notes");

  const cliArgs = { location, budget, cuisines, rating, notes };

  try {
    const prefs = preferencesFromCLI(cliArgs);
    
    console.log("✅ Valid preferences parsed successfully:");
    console.log(JSON.stringify(prefs, null, 2));
    console.log("");

    // Validate location against dataset
    const locationValidation = await validateLocationWithSuggestions(prefs.location, repoRoot);
    if (!locationValidation.isValid) {
      console.log("⚠️  Location validation warnings:");
      console.log(`- Location "${prefs.location}" not found in dataset`);
      if (locationValidation.suggestions.length > 0) {
        console.log(`- Did you mean: ${locationValidation.suggestions.join(", ")}?`);
      }
      console.log("");
    } else {
      console.log("✅ Location found in dataset");
      console.log("");
    }

  } catch (error) {
    console.log("❌ Validation errors:");
    console.log(error.message);
    console.log("");
    
    // Show usage help
    console.log("Usage example:");
    console.log('node phase0/cli/milestone1.js prefs-parse --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4');
    console.log("");
    console.log("Valid budget bands: low, medium, high");
    console.log("Rating range: 1-5");
    console.log("Cuisines: comma-separated list");
    
    process.exitCode = 2;
  }
}

async function cmdIntegrate(args) {
  console.log("milestone1 integrate");
  console.log("");

  const { preferencesFromCLI } = await import(
    pathToFileURL(path.join(repoRoot, "phase2", "preferences", "index.js")).href
  );

  const { processWithDebug } = await import(
    pathToFileURL(path.join(repoRoot, "phase3", "integration", "index.js")).href
  );

  const location = parseFlagValue(args, "--location");
  const budget = parseFlagValue(args, "--budget");
  const cuisines = parseFlagValue(args, "--cuisines");
  const rating = parseFlagValue(args, "--rating");
  const notes = parseFlagValue(args, "--notes");
  const debug = args.includes("--debug");

  const cliArgs = { location, budget, cuisines, rating, notes };

  try {
    const prefs = preferencesFromCLI(cliArgs);
    
    console.log("🔍 Processing preferences:");
    console.log(JSON.stringify(prefs, null, 2));
    console.log("");

    const result = await processWithDebug(prefs, {
      repoRoot,
      ranking: {
        targetCount: 20,
        sortBy: 'composite'
      },
      prompt: {
        format: 'json',
        maxRecommendations: 5
      }
    });

    if (!result.success) {
      console.log("❌ Integration failed:");
      console.log(result.error);
      process.exitCode = 2;
      return;
    }

    console.log("✅ Integration completed successfully!");
    console.log("");

    // Show summary
    console.log("📊 Summary:");
    if (result.metadata && result.metadata.datasetInfo) {
      console.log(`- Dataset loaded: ${result.metadata.datasetInfo.totalLoaded} restaurants`);
    }
    if (result.metadata && result.metadata.filterStats) {
      console.log(`- After filtering: ${result.metadata.filterStats.final} restaurants`);
    }
    console.log(`- Final candidates: ${result.candidates.length} restaurants`);
    if (result.debug && result.debug.filtering && result.debug.filtering.reductionRate) {
      console.log(`- Filter reduction: ${result.debug.filtering.reductionRate}%`);
    }
    console.log("");

    // Show candidates
    if (result.candidates.length > 0) {
      console.log("🍽️  Top candidates:");
      result.candidates.slice(0, 5).forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.name} (${candidate.location})`);
        console.log(`   Rating: ${candidate.rating}/5 | Cost: ₹${candidate.cost} | Cuisines: ${candidate.cuisines.slice(0, 2).join(", ")}`);
        if (candidate.compositeScore) {
          console.log(`   Match Score: ${candidate.compositeScore.toFixed(1)}`);
        }
        console.log("");
      });
    }

    // Show debug info if requested
    if (debug && result.debug) {
      console.log("🐛 Debug information:");
      console.log(JSON.stringify(result.debug, null, 2));
    }

  } catch (error) {
    console.log("❌ Integration error:");
    console.log(error.message);
    console.log("");
    
    // Show usage help
    console.log("Usage example:");
    console.log('node phase0/cli/milestone1.js integrate --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4');
    console.log("");
    console.log("Add --debug for detailed information");
    
    process.exitCode = 2;
  }
}

async function cmdRecommend(args) {
  console.log("milestone1 recommend");
  console.log("");

  const { preferencesFromCLI } = await import(
    pathToFileURL(path.join(repoRoot, "phase2", "preferences", "index.js")).href
  );

  const { generateRecommendations } = await import(
    pathToFileURL(path.join(repoRoot, "phase4", "recommendation", "index.js")).href
  );

  const location = parseFlagValue(args, "--location");
  const budget = parseFlagValue(args, "--budget");
  const cuisines = parseFlagValue(args, "--cuisines");
  const rating = parseFlagValue(args, "--rating");
  const notes = parseFlagValue(args, "--notes");
  const debug = args.includes("--debug");
  const fallback = args.includes("--fallback");

  const cliArgs = { location, budget, cuisines, rating, notes };

  try {
    const prefs = preferencesFromCLI(cliArgs);
    
    console.log("🤖 Generating LLM recommendations...");
    console.log("Preferences:", JSON.stringify(prefs, null, 2));
    console.log("");

    const result = await generateRecommendations(prefs, {
      repoRoot,
      recommendation: {
        maxRecommendations: 5,
        enableFallback: fallback !== false,
        qualityThreshold: 'good'
      },
      groq: {
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        maxTokens: 2048
      }
    });

    if (!result.success) {
      console.log("❌ Recommendation failed:");
      console.log(result.error);
      process.exitCode = 2;
      return;
    }

    console.log("✅ Recommendations generated successfully!");
    console.log("");

    // Show summary
    console.log("📊 Summary:");
    if (result.metadata.integration && result.metadata.integration.candidateCount) {
      console.log(`- Candidates considered: ${result.metadata.integration.candidateCount}`);
    }
    console.log(`- Recommendations: ${result.recommendations.length}`);
    if (result.metadata.usedFallback) {
      console.log(`- Used fallback: ${result.metadata.fallbackReason || 'Yes'}`);
    }
    if (result.metadata.quality) {
      console.log(`- Quality assessment: ${result.metadata.quality.assessment}`);
    }
    console.log("");

    // Show recommendations
    if (result.recommendations.length > 0) {
      console.log("🍽️  Top recommendations:");
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.restaurant_name} (Rank: ${rec.rank})`);
        console.log(`   Match Score: ${rec.match_score}/100`);
        console.log(`   Explanation: ${rec.explanation}`);
        if (rec.candidate_data) {
          console.log(`   Details: ${rec.candidate_data.rating}/5 rating | ₹${rec.candidate_data.cost} | ${rec.candidate_data.cuisines?.slice(0, 2).join(", ")}`);
        }
        console.log("");
      });
    }

    // Show summary if available
    if (result.summary) {
      console.log("📝 Summary:");
      console.log(result.summary);
      console.log("");
    }

    // Show debug info if requested
    if (debug && result.metadata) {
      console.log("🐛 Debug information:");
      console.log(JSON.stringify(result.metadata, null, 2));
    }

  } catch (error) {
    console.log("❌ Recommendation error:");
    console.log(error.message);
    console.log("");
    
    // Show usage help
    console.log("Usage example:");
    console.log('node phase0/cli/milestone1.js recommend --location Banashankari --budget low --cuisines "South Indian" --rating 3.5');
    console.log("");
    console.log("Add --debug for detailed information");
    console.log("Add --fallback to enable/disable fallback behavior");
    
    process.exitCode = 2;
  }
}

const [, , cmd, ...rest] = process.argv;
if (rest.includes("--help") || rest.includes("-h")) {
  printHelp();
  process.exit(0);
}

try {
  switch (cmd) {
    case "info":
      cmdInfo();
      break;
    case "doctor":
      cmdDoctor();
      break;
    case "ingest-smoke":
      await cmdIngestSmoke(rest);
      break;
    case "prefs-parse":
      await cmdPrefsParse(rest);
      break;
    case "integrate":
      await cmdIntegrate(rest);
      break;
    case "recommend":
      await cmdRecommend(rest);
      break;
    case undefined:
    case "":
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error("");
      printHelp();
      process.exitCode = 2;
  }
} catch (e) {
  console.error(String(e?.stack || e));
  process.exitCode = 1;
}

