# Browser-only 100-rack baseline watt editor (29 Oct 2026)

Customize estimated watts for each of the 100 conceptual compute/fabric/storage racks. No NVIDIA proprietary CAD, site content, credentials or telemetry were copied. Historical manufacturer reference and known limitations remain in previous notes.

## Deterministic power calculator
floor100-power.mjs accepts an optional baseline-watt override map alongside its existing workload percentage (60/80/100) and illustrative PUE 1.20. Every override must match a known rack ID and be an integer between 0 and 250,000 W, divisible by 100. Unknown rack IDs and invalid maps are rejected without altering prior state.

Each edited rack has baselineW (raw assumed watt input), estimatedW (scaled by workload percentage), and customBaseline flag. Rack/row/floor totals, illustrative PUE facility estimate, watt heatmap and hypothetical A/B feeder load and capacity warnings all update together. Peak demand assumption is bounded to at least the custom baseline; this is not a vendor rating. No UPS, GPU, generator, cable or real facility control is exercised.

## UI, import and local persistence
Select a rack, edit its DEMO baseline watts, apply or reset a single rack, or clear all overrides. The total number of custom racks is visible. Settings persist only to browser localStorage at SPARK_FLOOR100_DEMO_RACK_WATTS_V1 if browser permits; restored data is validated and invalid stored values ignored. Existing power JSON export now includes customOverrides. Import accepts only the app's own export shape and BROWSER_ONLY_DEMO_ASSUMPTIONS provenance marker, at most 64 KiB, and validates the entire map before replacing any values. It does not upload files to a server.

This UI is not a digital twin, real meter, certified redundancy or wiring plan. Never use invented loads for physical engineering. QA includes Node unit checks and full isolated browser tests across 3 viewports, 16-rack service mode and 2D fallback.
