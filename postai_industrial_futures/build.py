#!/usr/bin/env python3
"""Build a self-contained, dependency-free research HTML from checked-in data.
Usage: python build.py [--output /path/output.html]
No network requests, fonts, or API keys are required.
"""
from pathlib import Path
import base64, json, argparse
ROOT = Path(__file__).resolve().parent

def data_uri(path: Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

def build(output: Path) -> None:
    data = json.loads((ROOT/'data/research.json').read_text(encoding='utf-8'))
    shell = (ROOT/'src/shell.html').read_text(encoding='utf-8')
    app = (ROOT/'src/app.js').read_text(encoding='utf-8').replace('__QR__',data_uri(ROOT/'assets/postai_qrcode.png','image/png'))
    replacements = {
        '/*__STYLE__*/': (ROOT/'src/style.css').read_text(encoding='utf-8'),
        '/*__DATA__*/': json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('</','<\\/'),
        '/*__MODEL__*/': (ROOT/'src/model.js').read_text(encoding='utf-8'),
        '/*__APP__*/': app,
        '__ICON__': data_uri(ROOT/'assets/postai_logo_icon.webp','image/webp'),
    }
    for key, value in replacements.items():
        shell = shell.replace(key, value)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(shell,encoding='utf-8')
    print(f'Built {output} ({output.stat().st_size:,} bytes)')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=ROOT/'index.html')
    build(parser.parse_args().output)
