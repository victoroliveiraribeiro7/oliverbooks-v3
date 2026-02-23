import os
from PIL import Image, ImageOps

def adapt_to_slide(input_path, output_path):
    # Definir tamanho High-End do Slider Widescreen (1920x1080)
    target_size = (1920, 1080)
    
    try:
        img = Image.open(input_path)
        img = img.convert('RGB')
        
        # Faz o Blur + Zoom do background pra preencher as bordas pretas como no cinema,
        # e depois cola a imagem original centralizada nítida sobre esse fundo.
        
        # Passo 1: Fundo Panorâmico (Desfocado/Escuro)
        bg = ImageOps.fit(img, target_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        
        # Filtro Dark Blur elegante (escurecer o fundo)
        from PIL import ImageFilter, ImageEnhance
        bg = bg.filter(ImageFilter.GaussianBlur(50))
        enhancer = ImageEnhance.Brightness(bg)
        bg = enhancer.enhance(0.4) # Deixa o fundo 60% mais escuro pra destacar a foto real no meio
        
        # Passo 2: Redimensionar Imagem Original pra caber verticalmente/horizontalmente sem cortar
        # Calcula a proporção pra encaixar
        img.thumbnail((target_size[0], target_size[1]), Image.Resampling.LANCZOS)
        
        # Passo 3: Mesclar
        # Cola a imagem original no centro exato do fundo panorâmico escuro
        x = (target_size[0] - img.width) // 2
        y = (target_size[1] - img.height) // 2
        
        bg.paste(img, (x, y))
        
        bg.save(output_path, quality=95)
        print(f"[SUCESSO] Adaptado com estilo High-End: {output_path}")
    except Exception as e:
        print(f"[ERRO] Não foi possível processar {input_path}: {e}")

if __name__ == '__main__':
    public_dir = os.path.join(os.path.dirname(__file__), 'public')
    books_to_process = [
        'slide_custom_1.jpg',
        'slide_custom_2.jpg',
        'slide_custom_3.jpg',
        'slide_custom_4.jpg'
    ]
    
    for filename in books_to_process:
        input_file = os.path.join(public_dir, filename)
        output_file = os.path.join(public_dir, filename.replace('.jpg', '_widescreen.jpg'))
        
        if os.path.exists(input_file):
            adapt_to_slide(input_file, output_file)
        else:
            print(f"[AVISO] O arquivo {filename} não foi encontrado na pasta public\\")
