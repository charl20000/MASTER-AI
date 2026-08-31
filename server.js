const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIGURATION DEPUIS .env ───
const API_URL = process.env.API_URL || "https://api-ai-ne1s.onrender.com";
const API_KEY = process.env.API_KEY;

// ─── MIDDLEWARES ───
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── ROUTE PRINCIPALE ───
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── ENDPOINT CHAT ───
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }

        if (!API_KEY) {
            return res.status(500).json({ error: 'Clé API non configurée' });
        }

        let prompt = message;
        if (history && history.length > 0) {
            const lastMessages = history.slice(-5);
            const historyText = lastMessages.map(m => 
                `${m.role === 'user' ? 'Utilisateur' : 'MASTER AI'}: ${m.content}`
            ).join('\n');
            prompt = `${historyText}\nUtilisateur: ${message}\nMASTER AI:`;
        }

        const response = await axios.post(
            `${API_URL}/api/generate`,
            { prompt: prompt },
            { headers: { "x-api-key": API_KEY } }
        );

        const reply = response.data.result || "Je n'ai pas pu générer de réponse.";

        res.json({
            success: true,
            message: reply,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur chat:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message 
        });
    }
});

// ─── ENDPOINT STATS ───
app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(API_URL);
        res.json({
            apiStatus: '✅ En ligne',
            apiData: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            apiStatus: '❌ Hors ligne',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ─── LANCEMENT ───
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  🧠 MASTER AI EN LIGNE 🧠           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  📡 PORT : ${PORT}                         ║`);
    console.log('║  ✅ STATUT : EN LIGNE                  ║');
    console.log('║  🌐 http://localhost:3000             ║');
    console.log('║  👑 Master Charbel                    ║');
    console.log('╚══════════════════════════════════════╝');
});

module.exports = app;
