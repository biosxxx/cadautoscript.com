from pathlib import Path
text = Path('static/utilities/pdf-number-extractor/app.html').read_text(encoding='utf-8')
start = text.index('en: {')
end = text.index('},\n    et:', start)
print(text[start:end+1])
