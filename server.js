// ============================================================
//  Lisboa Acessórios — Backend Node.js + Mercado Pago
//  Instale: npm install
//  Rode:    node server.js
// ============================================================

const express    = require('express');
const cors       = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app  = express();
const ACCESS_TOKEN = 'APP_USR-6660834644178503-060500-34233834d59144e8f0d1298b12b6a5a3-2986750195';
app.use(express.json());

// ╔══════════════════════════════════════════════════════════╗
// ║APP_USR-6660834644178503-060500-34233834d59144e8f0d1298b12b6a5a3-2986750195                       ║
// ╚══════════════════════════════════════════════════════════╝
const ACCESS_TOKEN = '';

const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

// ─── POST /create-preference ────────────────────────────────
// Recebe: { items: [{ title, quantity, unit_price }], payer? }
// Retorna: { init_point }
app.post('/create-preference', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    const preferenceData = {
      items: items.map(item => ({
        title:       item.title,
        quantity:    Number(item.quantity),
        unit_price:  Number(item.unit_price),
        currency_id: 'BRL',
      })),
      payment_methods: {
        installments: 2,       // máx parcelas
      },
      back_urls: {
        success: 'http://localhost:3000/sucesso.html',
        failure: 'http://localhost:3000/falha.html',
        pending: 'http://localhost:3000/pendente.html',
      },
      auto_return: 'approved',
      // ── Webhook: Mercado Pago avisará esta URL nos pagamentos ──
      notification_url: 'https://SEU_DOMINIO/webhook',
      statement_descriptor: 'Lisboa Acessorios',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    return res.json({ init_point: result.init_point });
  } catch (err) {
    console.error('Erro ao criar preferência:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /webhook ──────────────────────────────────────────
// Mercado Pago envia notificações de pagamento aqui
app.post('/webhook', async (req, res) => {
  const { type, data } = req.body;
  console.log('Webhook recebido:', type, data);

  if (type === 'payment') {
    const paymentId = data?.id;
    // Aqui você pode buscar os detalhes do pagamento e salvar no banco
    // Exemplo: GET https://api.mercadopago.com/v1/payments/:id
    console.log('Payment ID:', paymentId);
  }

  return res.sendStatus(200);
});

// ─── Servir arquivos estáticos (frontend) ───────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, '../')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅  Lisboa Acessórios rodando em http://localhost:${PORT}`);
  console.log(`📦  Endpoint: POST http://localhost:${PORT}/create-preference`);
  console.log(`🔔  Webhook:  POST http://localhost:${PORT}/webhook\n`);
});
