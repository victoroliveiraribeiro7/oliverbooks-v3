# Oliver Books | Projeto Editorial High-End (Continuidade)

Este arquivo serve como **memória técnica** para o Antigravity (ou qualquer IA assistente) continuar o projeto exatamente de onde paramos.

---

## 🚀 Status do Projeto
- **Objetivo:** Criar uma livraria online premium com estética editorial clássica.
- **Tecnologias:** Vite, Vanilla JavaScript, CSS Puro.
- **Hospedagem Futura:** VPS com WHM/cPanel (o build em `dist/` deve ser estático e leve).

---

## 🎨 Design System (Regras de Ouro)
- **Topologia:** Editorial Asymmetric Gallery. Evitar layouts 50/50. Usar tensões assimétricas (ex: cards deslocados no eixo Y em +80px).
- **Geometria:** Extremismo de bordas finas. `border-radius: 0` em quase tudo. Sem sombras de caixa (`box-shadow: none`).
- **Imagens:** Usamos **PNGs Transparentes Reais**. 
    - *Contexto:* Rodamos um script Python (`remove_bg.py`) que processou as 258 imagens do catálogo original, removeu o fundo branco e salvou localmente em `/public/books/`. 
    - *Sombra:* Usar apenas `filter: drop-shadow(...)` diretamente na imagem para que a sombra contorne o livro físico, não o quadrado da imagem.
- **Tipografia:** 
    - Títulos: `Playfair Display` (Serifada, elegante, tamanhos grandes).
    - Corpo/Labels: `Inter` (Sans-serif, limpa).
- **Cores:**
    - Fundo: `#FDF9F3` (Creme Suave).
    - Primária: `#7B8C7B` (Verde Oliva).
    - Texto/Destaque: `#2C3E2D` (Negro Profundo/Madeira).

---

## 🛠️ O que já foi feito
1. **Categorização Inteligente:** Filtramos o catálogo em 3 páginas dinâmicas: `/livros/`, `/biblias/` e `/novidades/`.
2. **Hero Slider:** Slider de 100vw com efeito Ken Burns (zoom suave) e 3 lâminas focadas nas coleções.
3. **Página de Produto:** Refatorada para o estilo editorial, sem fundos cinzas, focada no livro "flutuando" na cor creme.
4. **Git Sync:** Projeto inicializado e sincronizado com o repositório **oliverbooks-v3**.

---

## 🎯 PRÓXIMO PASSO: Carrinho de Compras (Cart)
O usuário deseja implementar o Carrinho. Recomendações para a IA:
1. **Design:** O carrinho deve ser um "Slide-In" da direita ou um modal minimalista mantendo o estilo `0px radius` e fontes serifadas.
2. **Arquitetura:** Usar LocalStorage para persistir os itens do carrinho entre as páginas.
3. **Draft de Fluxo:** 
   - Botão "Adquirir Já" na home e páginas de produto dispara o Carrinho.
   - Resumo do pedido com miniatura do livro (PNG transparente).
   - Checkout simplificado (focado em experiência premium).

---

### Mensagem para a IA:
"Ao retomar este projeto, leia o `style.css` para entender o sistema de variáveis e o `books.js` para garantir que está usando as imagens locais transparentes em `/public/books/`."
