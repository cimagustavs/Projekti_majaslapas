# The whole page in one file: CSS, JS and images inlined. Usage: python3 tools/siluets/bundle.py demos/siluets preview/siluets/siluets-demo.html
import base64, mimetypes, pathlib, re, sys
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = (src / 'index.html').read_text()
uri = lambda rel: f"data:{mimetypes.guess_type(rel)[0] or 'image/webp'};base64," + base64.b64encode((src / rel).read_bytes()).decode()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (src / 'style.css').read_text() + '\n</style>')
for js in ('data.js', 'script.js', 'lpg.js'):
    html = html.replace(f'<script src="{js}"></script>', '<script>\n' + (src / js).read_text() + '\n</script>')
html = re.sub(r'(src|srcset)="(img/[^"]+)"', lambda m: f'{m.group(1)}="{uri(m.group(2))}"', html).replace(' loading="lazy"', '')
html = re.sub(r'\s*<meta property="og:image[^>]*>', '', html)
out.parent.mkdir(parents=True, exist_ok=True); out.write_text(html)
print(out, len(html) // 1024, 'KB')
