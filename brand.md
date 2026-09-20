# Brand: Rivera

_Status: deferred_

The user chose to defer brand setup. This project is currently using a Rivera operations-console theme (stone, river teal, paper) rather than prompting for a full brand session mid-build.

To set up a real brand palette, typography, and voice at any time, run:

    /brand-design

or say: "pick brand colors"

When `brand-design` runs, it will detect this deferred state, skip the "confirm overwrite" step, and proceed directly to the full brand setup. The resulting palette will be applied to `app/globals.css` and this file will be replaced with the real brand documentation.

_Deferred at: 2026-09-19T05:05:00Z_
