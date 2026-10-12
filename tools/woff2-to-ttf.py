#!/usr/bin/env python3
# Usage : python3 tools/woff2-to-ttf.py fonts fonts/ttf   (nécessite : pip install fonttools brotli)
# OpenDyslexic (contours CFF) est converti en contours TrueType.
# Convertit les WOFF2 de fonts/ en TTF à contours TrueType (exigés par jsPDF), sous-ensemble latin.
import sys, pathlib
from fontTools.ttLib import TTFont, newTable
from fontTools import subset
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x20AC]

def cff_to_glyf(font):
    glyph_set = font.getGlyphSet()
    glyf = newTable("glyf"); glyf.glyphOrder = font.getGlyphOrder(); glyf.glyphs = {}
    for name in glyf.glyphOrder:
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
        glyf.glyphs[name] = pen.glyph()
    font["glyf"] = glyf
    font["loca"] = newTable("loca")
    del font["CFF "]
    if "VORG" in font: del font["VORG"]
    maxp = font["maxp"]; maxp.tableVersion = 0x00010000
    for attr in ("maxZones", "maxTwilightPoints", "maxStorage", "maxFunctionDefs", "maxInstructionDefs", "maxStackElements", "maxSizeOfInstructions", "maxComponentElements"):
        setattr(maxp, attr, 0 if attr != "maxZones" else 1)
    maxp.maxComponentDepth = 0; maxp.maxPoints = maxp.maxContours = maxp.maxCompositePoints = maxp.maxCompositeContours = 0
    font["head"].indexToLocFormat = 0; font["head"].glyphDataFormat = 0
    font["post"].formatType = 2.0; font["post"].extraNames = []; font["post"].mapping = {}
    font.sfntVersion = "\x00\x01\x00\x00"

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
for woff in sorted(src.glob("*.woff2")):
    font = TTFont(woff)
    opts = subset.Options(); opts.layout_features = ["*"]; opts.name_IDs = ["*"]; opts.notdef_outline = True
    s = subset.Subsetter(opts); s.populate(unicodes=UNICODES); s.subset(font)
    if "CFF " in font: cff_to_glyf(font)
    font.flavor = None
    dest = out / (woff.stem + ".ttf")
    font.save(dest)
    print(dest.name, dest.stat().st_size // 1024, "Ko", len(font.getGlyphOrder()), "glyphes")
