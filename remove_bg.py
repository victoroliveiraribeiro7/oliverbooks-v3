from PIL import Image
import urllib.request
import os
import json
import re

public_dir = r"c:\Users\victor.ribeiro\Documents\site\oliverbooks\public\books"
os.makedirs(public_dir, exist_ok=True)

with open(r"c:\Users\victor.ribeiro\Documents\site\oliverbooks\src\books.js", "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r"export const books = (\[.*?\]);", text, re.DOTALL)
books = json.loads(match.group(1))

def process_image(url, out_path):
    if os.path.exists(out_path): 
        return True
    try:
        urllib.request.urlretrieve(url, out_path + ".tmp")
        img = Image.open(out_path + ".tmp").convert("RGBA")
        data = img.getdata()
        
        new_data = []
        for item in data:
            if item[0] > 235 and item[1] > 235 and item[2] > 235:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        img.save(out_path, "PNG")
        os.remove(out_path + ".tmp")
        return True
    except Exception as e:
        print(f"Failed {url}: {e}")
        return False

print("Iniciando remoção de fundos em TODAS as imagens...")
total = len(books)
count = 0
for idx, book in enumerate(books):
    new_images = []
    for i, img_url in enumerate(book['images']):
        if img_url.startswith('http'):
            filename = f"book_{book['id']}_{i}.png"
            filepath = os.path.join(public_dir, filename)
            if process_image(img_url, filepath):
                new_images.append(f"/books/{filename}")
                count += 1
                if count % 20 == 0: print(f"-> {count} capas processadas com sucesso.")
            else:
                new_images.append(img_url)
        else:
            new_images.append(img_url)
    book['images'] = new_images

out_text = text[:match.start(1)] + json.dumps(books, indent=2, ensure_ascii=False) + text[match.end(1):]
with open(r"c:\Users\victor.ribeiro\Documents\site\oliverbooks\src\books.js", "w", encoding="utf-8") as f:
    f.write(out_text)

print(f"Concluído! {count} imagens totais processadas e livres de fundo.")
