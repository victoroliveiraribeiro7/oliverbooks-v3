import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import sharp from 'sharp';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('Connecting to database...');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log('Successfully connected to remote MySQL');
        conn.release();
    })
    .catch(err => {
        console.error('Failed to connect to MySQL:', err.message);
        process.exit(1);
    });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
};

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'books');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'ul_' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// POST file upload with automated background removal
app.post('/api/upload', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'p_' + req.file.filename.replace(path.extname(req.file.filename), '.png'));

    try {
        console.log(`[DEBUG] Processing image background: ${req.file.filename}`);

        // Usando Sharp para tornar branco (ou quase branco) em transparente
        await sharp(inputPath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                const { width, height, channels } = info;
                for (let i = 0; i < data.length; i += channels) {
                    // Se o pixel é "quase branco" (Threshold > 240 em R, G e B)
                    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                        data[i + 3] = 0; // Alpha = 0 (transparente)
                    }
                }
                return sharp(data, { raw: { width, height, channels } })
                    .png()
                    .toFile(outputPath);
            });

        // Opcional: remover o arquivo original do multer para economizar espaço
        fs.unlinkSync(inputPath);

        res.json({ url: `/books/${path.basename(outputPath)}` });
    } catch (err) {
        console.error('Error processing image:', err);
        // Se falhar o processamento, retornamos a imagem original como fallback
        res.json({ url: `/books/${req.file.filename}` });
    }
});

// GET all products with images
app.get('/api/products', async (req, res) => {
    // Disable all caches (Nginx proxy_cache, browser cache, CDN)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('X-Accel-Expires', '0');

    // Check if it's an admin request by looking for token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let isAdminRequest = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'admin') isAdminRequest = true;
        } catch (e) { }
    }

    try {
        let query = `
      SELECT p.*, GROUP_CONCAT(pi.image_url) as image_urls
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `;

        if (!isAdminRequest) {
            // For storefront: must be active AND have stock > 0
            query += ` WHERE p.is_active = 1 AND p.stock > 0 `;
        }

        query += ` GROUP BY p.id `;

        const [products] = await pool.query(query);

        const formatted = products.map(p => ({
            ...p,
            images: p.image_urls ? p.image_urls.split(',') : [],
            price: `R$ ${parseFloat(p.sale_price || 0).toFixed(2).replace('.', ',')}`,
            promo_price_formatted: p.promo_price && parseFloat(p.promo_price) > 0 ? `R$ ${parseFloat(p.promo_price).toFixed(2).replace('.', ',')}` : null,
            isNew: !!p.is_featured_news,
            tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || { categories: [], resources: [], translation: [], size: [] })
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new product
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    const { title, author, isbn, cost_price, sale_price, promo_price, description, category, publisher, stock, images, is_featured_news, tags } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [result] = await connection.query(
            'INSERT INTO products (title, author, isbn, cost_price, sale_price, promo_price, description, category, publisher, stock, is_featured_news, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                title || null,
                author || null,
                isbn || null,
                cost_price || 0,
                sale_price || 0,
                promo_price || 0,
                description || null,
                category || null,
                publisher || null,
                stock || 0,
                is_featured_news || 0,
                tags ? JSON.stringify(tags) : null
            ]
        );

        const productId = result.insertId;

        if (images && images.length > 0) {
            const imgQueries = images.map((url, index) =>
                connection.query('INSERT INTO product_images (product_id, image_url, is_cover) VALUES (?, ?, ?)', [productId, url, index === 0])
            );
            await Promise.all(imgQueries);
        }

        await connection.commit();
        res.status(201).json({ id: productId, message: 'Product created' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// BULK UPDATE product status - MUST BE BEFORE /:id
app.put('/api/products/bulk/status', authenticateToken, isAdmin, async (req, res) => {
    console.log('[DEBUG] Bulk status update request:', req.body);
    const { ids, is_active } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Nenhum produto selecionado.' });
    }

    try {
        await pool.query(
            'UPDATE products SET is_active = ? WHERE id IN (?)',
            [is_active ? 1 : 0, ids]
        );
        res.json({ message: `${ids.length} produtos atualizados com sucesso.` });
    } catch (err) {
        console.error('[DEBUG] Bulk update error:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE product
app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, cost_price, sale_price, promo_price, description, category, publisher, stock, is_active, is_featured_news, tags, images } = req.body;

    console.log(`[DEBUG] Updating product ID: ${id}`);
    console.log(`[DEBUG] Payload:`, JSON.stringify(req.body));

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [result] = await connection.query(
            'UPDATE products SET title=?, author=?, isbn=?, cost_price=?, sale_price=?, promo_price=?, description=?, category=?, publisher=?, stock=?, is_active=?, is_featured_news=?, tags=? WHERE id=?',
            [
                title || null,
                author || null,
                isbn || null,
                cost_price || 0,
                sale_price || 0,
                promo_price || 0,
                description || null,
                category || null,
                publisher || null,
                stock || 0,
                is_active ?? 1,
                is_featured_news || 0,
                tags ? JSON.stringify(tags) : null,
                id
            ]
        );
        console.log(`[DEBUG] Update result:`, result);

        if (images !== undefined) {
            // delete existing images
            await connection.query('DELETE FROM product_images WHERE product_id = ?', [id]);

            if (images.length > 0) {
                const imgQueries = images.map((url, index) =>
                    connection.query('INSERT INTO product_images (product_id, image_url, is_cover) VALUES (?, ?, ?)', [id, url, index === 0])
                );
                await Promise.all(imgQueries);
            }
        }

        await connection.commit();
        res.json({ message: 'Product updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// DELETE product
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- AUTHENTICATION API ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Verifica se o email já existe
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'customer']
        );

        const userId = result.insertId;

        // Auto-vinculo de pedidos antigos pelo email
        await pool.query('UPDATE orders SET user_id = ? WHERE customer_email = ? AND user_id IS NULL', [userId, email]);

        const token = jwt.sign({ id: userId, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: userId, name, email, role: 'customer' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/google
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Verifica se o usuário já existe
        let [users] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [sub, email]);
        let user;

        if (users.length === 0) {
            // Cria novo usuário via Google
            const [result] = await pool.query(
                'INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)',
                [name, email, sub, 'customer']
            );
            user = { id: result.insertId, name, email, role: 'customer' };

            // Auto-vinculo de pedidos antigos
            await pool.query('UPDATE orders SET user_id = ? WHERE customer_email = ? AND user_id IS NULL', [user.id, email]);
        } else {
            user = users[0];
            // Se o usuário existia por email mas não tinha google_id, atualiza
            if (!user.google_id) {
                await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [sub, user.id]);
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Erro na autenticação com Google: ' + err.message });
    }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/orders
app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COUPONS API ---

// GET all coupons
app.get('/api/coupons', async (req, res) => {
    try {
        const [coupons] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/coupons/validate
app.post('/api/coupons/validate', async (req, res) => {
    const { code, cartTotal } = req.body;
    try {
        const [coupons] = await pool.query('SELECT * FROM coupons WHERE code = ?', [code]);
        if (coupons.length === 0) {
            return res.status(404).json({ error: 'Cupom inválido.' });
        }

        const coupon = coupons[0];
        const now = new Date();

        // Validate expiry
        if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
            return res.status(400).json({ error: 'Cupom expirado.' });
        }

        // Validate min purchase
        if (coupon.min_purchase && cartTotal < parseFloat(coupon.min_purchase)) {
            return res.status(400).json({ error: `O valor mínimo para usar este cupom é R$ ${coupon.min_purchase}` });
        }

        // Return simplified safe coupon
        res.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                value: coupon.value,
                min_purchase: coupon.min_purchase
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new coupon
app.post('/api/coupons', authenticateToken, isAdmin, async (req, res) => {
    const { code, discount_type, value, min_purchase, expiry_date, total_usage_limit, per_cpf_usage_limit, scope, scope_target_id } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO coupons (code, discount_type, value, min_purchase, expiry_date, total_usage_limit, per_cpf_usage_limit, scope, scope_target_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [code, discount_type, value, min_purchase, expiry_date || null, total_usage_limit || null, per_cpf_usage_limit || 1, scope || 'global', scope_target_id || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Coupon created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE coupon
app.put('/api/coupons/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { code, discount_type, value, min_purchase, expiry_date, total_usage_limit, per_cpf_usage_limit, scope, scope_target_id } = req.body;
    try {
        await pool.query(
            'UPDATE coupons SET code=?, discount_type=?, value=?, min_purchase=?, expiry_date=?, total_usage_limit=?, per_cpf_usage_limit=?, scope=?, scope_target_id=? WHERE id=?',
            [code, discount_type, value, min_purchase, expiry_date || null, total_usage_limit || null, per_cpf_usage_limit || 1, scope || 'global', scope_target_id || null, id]
        );
        res.json({ message: 'Coupon updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE coupon
app.delete('/api/coupons/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ORDERS API ---

// GET all orders
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new order
app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_email, customer_phone, customer_address, total_price, payment_method, items } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, customer_address, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.body.user_id || null, customer_name, customer_email, customer_phone, customer_address, total_price, 'pending', payment_method || 'InfinitePay']
        );

        const orderId = orderResult.insertId;

        if (items && items.length > 0) {
            const itemQueries = items.map(item =>
                connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                    [orderId, item.id || null, item.quantity, item.price]
                )
            );
            await Promise.all(itemQueries);
        }

        await connection.commit();
        res.status(201).json({ id: orderId, message: 'Pedido criado com sucesso' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// GET order details with items
app.get('/api/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });

        const [items] = await pool.query(`
      SELECT oi.*, p.title as product_title, pi.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_cover = 1
      WHERE oi.order_id = ?
    `, [id]);

        res.json({ ...orders[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE order status/tracking
app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status, tracking_code } = req.body;
    try {
        // Obter status atual para o histórico
        const [current] = await pool.query('SELECT status FROM orders WHERE id = ?', [id]);
        if (current.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });

        const oldStatus = current[0].status;

        await pool.query(
            'UPDATE orders SET status = ?, tracking_code = ? WHERE id = ?',
            [status || oldStatus, tracking_code || null, id]
        );

        // Registrar no histórico se o status mudou
        if (status && status !== oldStatus) {
            await pool.query(
                'INSERT INTO order_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
                [id, oldStatus, status, 'Admin Panel']
            );
        }

        res.json({ message: 'Pedido atualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WEBHOOKS API ---

// --- INFINITEPAY API (PROXY) ---
app.post('/api/infinitepay/checkout', async (req, res) => {
    try {
        const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (err) {
        console.error('Erro no proxy do InfinitePay:', err);
        res.status(500).json({ error: err.message });
    }
});


// InfinitePay Webhook
app.post('/api/webhooks/infinitepay', async (req, res) => {
    // A InfinitePay envia o payload no corpo da requisição (POST)
    // Os dados principais costumam incluir: order_nsu, transaction_nsu, status
    const { order_nsu, transaction_nsu, status: pay_status } = req.body;

    console.log('--- WEBHOOK INFINITEPAY RECEBIDO ---');
    console.log('NSU Pedido:', order_nsu);
    console.log('NSU Transação:', transaction_nsu);

    if (!order_nsu) return res.status(400).send('NSU não fornecido');

    // O order_nsu está no formato: ORDER-{id}-{timestamp}
    // Vamos extrair o ID numérico entre os hífens
    const parts = order_nsu.split('-');
    const orderId = parts[1];

    if (!orderId) return res.status(400).send('ID do pedido não identificado no NSU');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Verificar se o pedido existe e está pendente
        const [orders] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) throw new Error('Pedido não encontrado');

        const currentStatus = orders[0].status;

        // Se já estiver pago, ignoramos (evitar duplicidade)
        if (currentStatus === 'paid') {
            await connection.rollback();
            return res.status(200).send('Pedido já processado');
        }

        // 2. Atualizar Status do Pedido
        // Nota: Adaptar o 'success' conforme o status real que a InfinitePay envia (geralmente enviamos apenas se for sucesso)
        await connection.query(
            'UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?',
            ['paid', transaction_nsu || null, orderId]
        );

        // 3. Subtrair Estoque
        // Pegar os itens do pedido para baixar o estoque
        const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);

        for (const item of items) {
            await connection.query(
                'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // 4. Registrar no Histórico
        await connection.query(
            'INSERT INTO order_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
            [orderId, currentStatus, 'paid', 'InfinitePay Webhook']
        );

        await connection.commit();
        console.log(`Pedido ${orderId} atualizado para PAGO via Webhook.`);
        res.status(200).send('OK');
    } catch (err) {
        await connection.rollback();
        console.error('Erro no Webhook:', err.message);
        res.status(500).send('Internal Server Error');
    } finally {
        connection.release();
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
