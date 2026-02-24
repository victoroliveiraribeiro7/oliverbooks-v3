import os
from PIL import Image, ImageOps

def adapt_to_slide_fill(input_path, output_path):
    # Definir tamanho High-End do Slider Widescreen (1920x1080)
    target_size = (1920, 1080)
    
    try:
        img = Image.open(input_path)
        img = img.convert('RGB')
        
        # Em vez de criar fundo borrado e colar no meio (usado para fotos verticais),
        # como as suas fotos já são horizontais, faremos um CROP inteligente (Fill)
        # que preenche 100% da tela 16:9 garantindo que não sobre nenhuma borda!
        filled_img = ImageOps.fit(img, target_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        
        filled_img.save(output_path, quality=95)
        print(f"[SUCESSO] Preenchimento Total (16:9): {output_path}")
    except Exception as e:
        print(f"[ERRO] Não foi possível processar {input_path}: {e}")

if __name__ == '__main__':
    public_dir = os.path.join(os.path.dirname(__file__), 'public')
    books_to_process = [
        'slide_custom_1.jpg',
        'slide_custom_2.jpg',
        'slide_custom_3.jpg'
    ]
    
    for filename in books_to_process:
        input_file = os.path.join(public_dir, filename)
        output_file = os.path.join(public_dir, filename.replace('.jpg', '_widescreen.jpg'))
        
        if os.path.exists(input_file):
            adapt_to_slide_fill(input_file, output_file)
        else:
            print(f"[AVISO] O arquivo {filename} não foi encontrado na pasta public\\")
