const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve file statici nella directory 'public'

// Connessione a MongoDB
mongoose.connect('mongodb://localhost:27017/prenotazioni', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Errore di connessione:'));
db.once('open', () => {
  console.log('Connesso a MongoDB');
});

// Schema per gli slot
const slotSchema = new mongoose.Schema({
  field: String,
  date: String,
  time: String,
  user: String,
});
const Slot = mongoose.model('Slot', slotSchema);

// API per ottenere gli slot disponibili
app.get('/api/slots', async (req, res) => {
  const { field, date } = req.query;
  const slots = await Slot.find({ field, date });
  res.json(slots);
});

// API per prenotare uno slot
app.post('/api/slots', async (req, res) => {
  const { field, date, time, user } = req.body;

  // Controlla se lo slot è già prenotato
  const existingSlot = await Slot.findOne({ field, date, time });
  if (existingSlot) {
    return res.status(400).json({ message: 'Slot già prenotato' });
  }

  const slot = new Slot({ field, date, time, user });
  await slot.save();
  res.json(slot);
});

// API per cancellare una prenotazione
app.delete('/api/slots', async (req, res) => {
  const { field, date, time, user } = req.body;
  const result = await Slot.deleteOne({ field, date, time, user });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Prenotazione non trovata' });
  }
  res.json({ message: 'Prenotazione cancellata' });
});

// Serve l'interfaccia frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Avvia il server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
