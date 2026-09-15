"""Build docs/LectureAI_Documentation.pdf from template.html (Playwright + Chromium).
Usage: python docs/build_pdf/build.py   (requires: pip install playwright && playwright install chromium)"""
import base64, html, re
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

source = (ROOT / "src" / "lib" / "generate.ts").read_text(encoding="utf-8")
prompt = re.search(r"const SYSTEM_PROMPT = `(.*?)`;", source, re.S).group(1)

page_html = (HERE / "template.html").read_text(encoding="utf-8").replace("{{PROMPT}}", html.escape(prompt))
for name in ("loading", "quiz", "cards"):
    data = base64.b64encode((HERE / f"{name}.png").read_bytes()).decode()
    page_html = page_html.replace(f"{{{{IMG_{name}}}}}", f"data:image/png;base64,{data}")

footer = ('<div style="width:100%;font-size:8px;color:#8a94a6;padding:0 16mm;display:flex;justify-content:space-between;'
          'font-family:Segoe UI,Arial,sans-serif"><span>LectureAI — документация проекта · команда BRILLIANTS</span>'
          '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')

out = ROOT / "docs" / "LectureAI_Documentation.pdf"
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_content(page_html, wait_until="load")
    page.pdf(path=str(out), format="A4", print_background=True, display_header_footer=True,
             header_template="<div></div>", footer_template=footer,
             margin={"top": "16mm", "bottom": "18mm", "left": "16mm", "right": "16mm"})
    browser.close()
print("written", out)
