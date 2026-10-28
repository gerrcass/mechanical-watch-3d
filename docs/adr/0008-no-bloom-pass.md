# 0008 — No bloom pass in the shipped composer

The composer uses Render → Outline → SMAA → Output → Grade. The `UnrealBloomPass` was removed after it produced a black frame in the production composer on the capture path (SwiftShader/Chromium); disabling it restored the image, and re-adding it reproduced the failure. The exhibit keeps ACES tone mapping, a restrained grade, the outline and SMAA, and gets its glow from emissive materials and the studio environment instead.

**Consequences:** the quality tiers no longer carry bloom fields, and the spec's post-processing line records the deviation. A future bloom pass must be validated against the same deterministic screenshot path before it ships; the black-frame failure is the regression test that matters.
