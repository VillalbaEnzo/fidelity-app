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

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).send("Token manquant");
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) { res.status(401).send("Token invalide"); }
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

app.get('/api/user/me', auth, async (req, res) => {
    const tokenQR = uuidv4();
    const user = await User.findByIdAndUpdate(req.user.id, { qrToken: tokenQR }, { new: true });
    res.json({ balance: user.balance, qrToken: tokenQR });
});

app.post('/api/admin/scan', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Accès refusé" });

    const { qrData } = req.body;
    const user = await User.findOne({ qrToken: qrData });

    if (!user) return res.status(404).json({ error: "QR Code invalide ou expiré" });
    if (user.balance <= 0) return res.status(400).json({ error: "Plus de coupes !" });

    user.balance -= 1;
    user.qrToken = null;
    user.history.push({ action: "Coupe déduite via Scan" });
    await user.save();

    res.json({ success: true, newBalance: user.balance, email: user.email });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(process.env.PORT, () => console.log(`Serveur prêt sur port ${process.env.PORT}`)))
    .catch(err => console.error(err));