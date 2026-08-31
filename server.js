const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIGURATION ───
const API_URL = process.env.API_URL || "https://api-ai-ne1s.onrender.com";
const API_KEY = process.env.API_KEY || "ma-super-clef-api-2026";

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

// ─── ENDPOINT CHAT AVEC FALLBACK ───
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }

        // ─── CONSTRUCTION DU PROMPT ───
        let prompt = message;
        if (history && history.length > 0) {
            const lastMessages = history.slice(-5);
            const historyText = lastMessages.map(m => 
                `${m.role === 'user' ? 'Utilisateur' : 'MASTER AI'}: ${m.content}`
            ).join('\n');
            prompt = `${historyText}\nUtilisateur: ${message}\nMASTER AI:`;
        }

        // ─── APPEL À L'API ───
        let reply = "Je n'ai pas pu générer de réponse. Réessaie plus tard.";

        try {
            const response = await axios.post(
                `${API_URL}/api/generate`,
                { prompt: prompt },
                { 
                    headers: { "x-api-key": API_KEY },
                    timeout: 15000
                }
            );
            
            if (response.data && response.data.result) {
                reply = response.data.result;
            } else {
                reply = "L'API a répondu mais le format est invalide.";
            }
        } catch (apiError) {
            console.error('Erreur API:', apiError.message);
            
            // ─── FALLBACK : Réponses prédéfinies ───
            const fallbacks = [
                "Je suis MASTER AI, ton assistant intelligent. Comment puis-je t'aider ?",
                "Désolé, l'API est temporairement indisponible. Réessaie dans quelques instants.",
                "Je suis en ligne mais je n'arrive pas à contacter mon cerveau IA. Réessaie plus tard.",
                "MASTER AI est actuellement en maintenance. Reviens dans 5 minutes !"
            ];
            reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        res.json({
            success: true,
            message: reply,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            message: 'Une erreur est survenue. Réessaie plus tard.'
        });
    }
});

// ─── ENDPOINT STATS ───
app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(API_URL, { timeout: 5000 });
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
