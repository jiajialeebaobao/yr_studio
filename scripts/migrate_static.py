"""One-time mechanical migration of the retained HTML into React sections."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import shutil

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

VOID = {'img', 'input', 'br', 'meta', 'link', 'hr', 'source'}
class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID: self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        if self.stack[-1].tag == tag: self.stack.pop()
    def handle_data(self, data): self.stack[-1].children.append(data)

source = Path('index.html').read_text()
parser = Parser()
parser.feed(source)
assets = set()
names = {'class': 'className', 'tabindex': 'tabIndex', 'for': 'htmlFor', 'viewbox': 'viewBox',
 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
 'text-anchor': 'textAnchor', 'font-family': 'fontFamily', 'font-size': 'fontSize', 'font-weight': 'fontWeight',
 'stop-color': 'stopColor', 'flood-color': 'floodColor', 'flood-opacity': 'floodOpacity', 'stddeviation': 'stdDeviation',
 'fill-opacity': 'fillOpacity', 'stroke-opacity': 'strokeOpacity', 'stroke-dasharray': 'strokeDasharray'}
def render(node):
    if isinstance(node, str): return escape(node).replace('{', '&#123;').replace('}', '&#125;')
    classes = node.attrs.get('class', '').split()
    if 'map-visual' in classes: return ''
    if 'space-gallery' in classes: return '<EnvironmentCarousel />'
    if node.tag == 'form': return '<BookingForm />'
    attrs = []
    for key, value in node.attrs.items():
        if value is None: attrs.append(names.get(key, key)); continue
        if key in ('src', 'href') and value.startswith('assets/'):
            assets.add(value); value = '/' + value
        attrs.append(f'{names.get(key, key)}="{escape(value, quote=True)}"')
    start = '<' + node.tag + (' ' + ' '.join(attrs) if attrs else '')
    if node.tag in VOID: return start + ' />'
    return start + '>' + ''.join(render(child) for child in node.children) + '</' + node.tag + '>'

def find(node, predicate):
    if isinstance(node, str): return None
    if predicate(node): return node
    for child in node.children:
        found = find(child, predicate)
        if found: return found

sections = [('Header', lambda n: n.tag == 'header'), ('Hero', lambda n: n.attrs.get('class') == 'hero'),
 ('Courses', lambda n: n.attrs.get('id') == 'classes'), ('Studio', lambda n: n.attrs.get('id') == 'studio'),
 ('Teachers', lambda n: n.attrs.get('id') == 'teachers'), ('Pricing', lambda n: n.attrs.get('id') == 'pricing'),
 ('BookingSection', lambda n: n.attrs.get('id') == 'booking'), ('Footer', lambda n: n.tag == 'footer')]
Path('components').mkdir(exist_ok=True)
Path('app').mkdir(exist_ok=True)
code = 'import EnvironmentCarousel from "./environment-carousel";\nimport BookingForm from "./booking-form";\n'
for name, predicate in sections:
    code += f'\nexport function {name}() {{ return ({render(find(parser.root, predicate))}); }}\n'
Path('components/sections.tsx').write_text(code)
css = source.split('<style>', 1)[1].split('</style>', 1)[0]
css = css.replace('url("assets/', 'url("/assets/')
Path('app/globals.css').write_text(css)
assets.update(['assets/hero-yoga-studio.png', 'assets/studio-interior-01.jpg', 'assets/studio-interior-02.jpg', 'assets/studio-interior-03.jpg'])
Path('public/assets').mkdir(parents=True, exist_ok=True)
for asset in assets: shutil.copy2(asset, Path('public') / asset)
print('Migrated static sections and', len(assets), 'referenced assets')
