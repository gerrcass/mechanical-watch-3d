# 0002 — Procedural geometry and textures only

Every mesh, material and surface finish is generated in code at boot: gear profiles from tooth counts, bridge silhouettes from curves, perlage and Côtes de Genève from canvas-generated roughness and bump maps, and a studio environment built from emissive geometry. The build ships no glTF, no image textures and no HDR files.

**Why:** the brief asks for a *diagram* that happens to be beautiful — every part must be addressable, explainable and separable. Generated parts carry their own metadata and can be regenerated at a different scale or tooth count; a downloaded model cannot without a re-export. It also keeps the artefact offline, licence-clean and small, and avoids the uncanny mismatch of a scanned hero asset beside generated ones.

**Consequences:** realism must come from silhouette, bevels, material response and lighting rather than texture detail. The material and texture modules are first-class product code, and the camera stays at a distance where the procedural tell is not visible. Total first-load weight stays under 1 MB of JS excluding Three.js.
