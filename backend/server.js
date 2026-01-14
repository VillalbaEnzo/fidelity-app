require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());
app.get('/api/ping', (req, res) => res.send("pong"));

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).send("Token manquant");
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) { res.status(401).send("Token invalide"); }
};

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

app.post('/api/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, role });
        res.json({ message: "Utilisateur créé !" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ error: "Identifiants incorrects" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, role: user.role });
});

app.get('/api/user/balance', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");
    res.json({ balance: user.balance });
});

app.get('/api/user/me', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).send("User not found");

        const now = new Date();
        const isExpired =
            !user.qrToken ||
            !user.qrTokenDate ||
            (now - new Date(user.qrTokenDate) > 86400000) ||
            user.qrStatus === 'used';

        if (isExpired) {
            const tokenQR = uuidv4();
            user = await User.findByIdAndUpdate(req.user.id, {
                qrToken: tokenQR,
                qrTokenDate: now,
                qrStatus: 'valid'
            }, { new: true });
        }
        res.json({ balance: user.balance,
            qrToken: user.qrToken,
            email: user.email,
            isFirstLogin: user.isFirstLogin
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/api/admin/scan', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });

    const { qrData } = req.body;
    const user = await User.findOne({ qrToken: qrData });
    if (!user) return res.status(404).json({ error: "QR Code invalide ou expiré" });
    if (user.qrStatus === 'used') {
        return res.status(400).json({ error: "Ce QR Code a déjà été utilisé." });
    }
    const now = new Date();
    if (now - new Date(user.qrTokenDate) > 86400000) {
        return res.status(400).json({ error: "Ce QR Code est expiré (24h)." });
    }

    if (user.balance <= 0) return res.status(400).json({ error: "Plus de coupes !" });

    user.balance -= 1;

    user.qrStatus = 'used';

    user.history.push({ action: "Coupe déduite via Scan" });
    await user.save();

    res.json({ success: true, newBalance: user.balance, email: user.email });
});

app.get('/api/admin/users', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });
    try {
        const users = await User.find().select('-password').sort({ role: 1, _id: -1 });
        res.json(users);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete('/api/admin/users/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ error: "Utilisateur introuvable" });

        if (userToDelete.role === 'admin') {
            return res.status(403).json({ error: "Impossible de supprimer un administrateur." });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Client supprimé" });
    } catch (err) { res.status(400).json({ error: "Erreur suppression" }); }
});

app.post('/api/admin/users', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });
    try {
        const { email, password, role, balance } = req.body;
        if (!email || !email.includes('@')) return res.status(400).json({ error: "Email invalide" });
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            role: role || 'user',
            balance: balance !== undefined ? balance : 24
        });

        res.json({ success: true, user: { email: newUser.email, role: newUser.role } });
    } catch (err) { res.status(400).json({ error: "Email déjà existant ou invalide" }); }
});

app.put('/api/admin/users/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });

    try {
        const { email, balance, password, role } = req.body;
        const updateData = { balance };

        if (role) {
            updateData.role = role;
        }

        if (email !== undefined) {
            if (!email || email.trim() === "" || !validateEmail(email)) {
                return res.status(400).json({ error: "Email invalide." });
            }
            updateData.email = email;
        }

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true, message: "Utilisateur mis à jour" });
    } catch (err) {
        res.status(400).json({ error: "Erreur lors de la mise à jour." });
    }
});

app.put('/api/user/me', auth, async (req, res) => {
    try {
        const { password } = req.body;
        const updateData = {};

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.isFirstLogin = false;
        }

        await User.findByIdAndUpdate(req.user.id, updateData);
        res.json({ success: true, message: "Mot de passe mis à jour" });
    } catch (err) {
        res.status(400).json({ error: "Erreur lors de la mise à jour." });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(process.env.PORT, () => console.log(`Serveur prêt sur port ${process.env.PORT}`)))
    .catch(err => console.error(err));