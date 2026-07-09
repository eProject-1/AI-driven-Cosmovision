from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "AI-Driven-Cosmovision-Project-Report.md"
OUTPUT = ROOT / "AI-Driven-Cosmovision-Project-Report.docx"


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def text_runs(text: str) -> str:
    parts = re.split(r"(`[^`]+`)", text)
    runs: list[str] = []
    for part in parts:
        if not part:
            continue
        if part.startswith("`") and part.endswith("`"):
            runs.append(
                "<w:r><w:rPr><w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\"/>"
                "<w:sz w:val=\"20\"/></w:rPr><w:t xml:space=\"preserve\">"
                f"{esc(part[1:-1])}</w:t></w:r>"
            )
        else:
            runs.append(f"<w:r><w:t xml:space=\"preserve\">{esc(part)}</w:t></w:r>")
    return "".join(runs)


def paragraph(text: str = "", style: str | None = None, bullet: bool = False) -> str:
    ppr = ""
    if style:
        ppr += f"<w:pStyle w:val=\"{style}\"/>"
    if bullet:
        ppr += "<w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr>"
    ppr_xml = f"<w:pPr>{ppr}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr_xml}{text_runs(text)}</w:p>"


def code_paragraph(text: str) -> str:
    return (
        "<w:p><w:pPr><w:pStyle w:val=\"Code\"/></w:pPr>"
        "<w:r><w:rPr><w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\"/>"
        "<w:sz w:val=\"18\"/></w:rPr>"
        f"<w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r></w:p>"
    )


def table(rows: list[list[str]]) -> str:
    cells_xml = []
    for row_index, row in enumerate(rows):
        row_xml = []
        for cell in row:
            shading = "<w:shd w:fill=\"D9EAF7\"/>" if row_index == 0 else ""
            row_xml.append(
                "<w:tc><w:tcPr><w:tcW w:w=\"2400\" w:type=\"dxa\"/>"
                f"{shading}</w:tcPr>{paragraph(cell)}</w:tc>"
            )
        cells_xml.append(f"<w:tr>{''.join(row_xml)}</w:tr>")
    return (
        "<w:tbl><w:tblPr><w:tblStyle w:val=\"TableGrid\"/>"
        "<w:tblW w:w=\"0\" w:type=\"auto\"/>"
        "<w:tblBorders><w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "<w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "<w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "<w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>"
        "</w:tblBorders></w:tblPr>"
        f"{''.join(cells_xml)}</w:tbl>"
    )


def parse_markdown(markdown: str) -> str:
    lines = markdown.splitlines()
    body: list[str] = []
    i = 0
    in_code = False
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code = not in_code
            i += 1
            continue
        if in_code:
            body.append(code_paragraph(line))
            i += 1
            continue
        if not stripped:
            body.append(paragraph(""))
            i += 1
            continue
        if stripped.startswith("|") and i + 1 < len(lines) and re.match(r"^\|\s*-", lines[i + 1].strip()):
            rows: list[list[str]] = []
            rows.append([cell.strip() for cell in stripped.strip("|").split("|")])
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([cell.strip() for cell in lines[i].strip().strip("|").split("|")])
                i += 1
            body.append(table(rows))
            continue
        if stripped.startswith("# "):
            body.append(paragraph(stripped[2:], "Title"))
        elif stripped.startswith("## "):
            body.append(paragraph(stripped[3:], "Heading1"))
        elif stripped.startswith("### "):
            body.append(paragraph(stripped[4:], "Heading2"))
        elif stripped.startswith("- "):
            body.append(paragraph(stripped[2:], bullet=True))
        else:
            body.append(paragraph(stripped))
        i += 1
    return "".join(body)


def content_types() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""


def rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def document_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>"""


def styles() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="1F4E79"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="300" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F4E79"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="220" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="2F75B5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="40"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>"""


def numbering() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>"""


def core_props() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>AI Driven Cosmovision Project Report</dc:title>
  <dc:creator>Group 2</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
</cp:coreProperties>"""


def app_props() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Word</Application>
</Properties>"""


def document(body: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""


def main() -> None:
    body = parse_markdown(SOURCE.read_text(encoding="utf-8"))
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", content_types())
        docx.writestr("_rels/.rels", rels())
        docx.writestr("word/_rels/document.xml.rels", document_rels())
        docx.writestr("word/document.xml", document(body))
        docx.writestr("word/styles.xml", styles())
        docx.writestr("word/numbering.xml", numbering())
        docx.writestr("docProps/core.xml", core_props())
        docx.writestr("docProps/app.xml", app_props())
    print(OUTPUT)


if __name__ == "__main__":
    main()
