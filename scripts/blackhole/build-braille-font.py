# /// script
# dependencies = ["fonttools[woff]"]
# ///

from __future__ import annotations

import io
import pathlib
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = pathlib.Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets/fonts/BlackholeBraille.woff2"
LICENSE_OUTPUT = ROOT / "assets/fonts/NotoSansSymbols2-OFL.txt"
JETBRAINS_OUTPUT = ROOT / "assets/fonts/JetBrainsMonoMedium.woff"
JETBRAINS_LICENSE_OUTPUT = ROOT / "assets/fonts/JetBrainsMono-OFL.txt"
FONT_URL = "https://fonts.gstatic.com/s/notosanssymbols2/v25/I_uyMoGduATTei9eI8daxVHDyfisHr71ypM.ttf"
LICENSE_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssymbols2/OFL.txt"
JETBRAINS_FONT_URL = "https://fonts.cdnfonts.com/s/98875/JetBrainsMonoMedium.woff"
JETBRAINS_LICENSE_URL = "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt"
TARGET_ADVANCE = 600


def download(url: str) -> bytes:
    with urllib.request.urlopen(url) as response:
        return response.read()


def main() -> None:
    font = TTFont(io.BytesIO(download(FONT_URL)))
    subsetter = subset.Subsetter()
    subsetter.populate(unicodes=range(0x2800, 0x2900))
    subsetter.subset(font)

    cmap = font.getBestCmap()
    glyph_names = {cmap[codepoint] for codepoint in range(0x2800, 0x2900)}
    glyf = font["glyf"]
    hmtx = font["hmtx"]
    advances = {hmtx[glyph_name][0] for glyph_name in glyph_names}
    if len(advances) != 1:
        raise RuntimeError(f"Braille glyphs have inconsistent advances: {sorted(advances)}")
    source_advance = advances.pop()
    scale = TARGET_ADVANCE / source_advance

    for glyph_name in glyph_names:
        glyph = glyf[glyph_name]
        if glyph.numberOfContours:
            coordinates, end_points, flags = glyph.getCoordinates(glyf)
            coordinates.transform(((scale, 0), (0, 1)))
            glyph.coordinates = coordinates
            glyph.endPtsOfContours = end_points
            glyph.flags = flags
            glyph.recalcBounds(glyf)
        _, left_side_bearing = hmtx[glyph_name]
        hmtx[glyph_name] = (TARGET_ADVANCE, round(left_side_bearing * scale))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font.recalcTimestamp = False
    font["head"].modified = 2082844800  # 1970-01-01 in OpenType's 1904 epoch.
    font.flavor = "woff2"
    font.save(OUTPUT)
    LICENSE_OUTPUT.write_bytes(download(LICENSE_URL))
    JETBRAINS_OUTPUT.write_bytes(download(JETBRAINS_FONT_URL))
    JETBRAINS_LICENSE_OUTPUT.write_bytes(download(JETBRAINS_LICENSE_URL))
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)")
    print(
        f"wrote {JETBRAINS_OUTPUT.relative_to(ROOT)} "
        f"({JETBRAINS_OUTPUT.stat().st_size} bytes)"
    )


if __name__ == "__main__":
    main()
