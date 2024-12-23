let currentUser = null;

// Lista degli orari di prenotazione disponibili
const timeSlots = [
  "11:00", "11:45",
  "12:00", "12:45",
  "13:00", "13:45",
  "14:00", "14:45",
  "15:00", "15:45",
  "16:00", "16:45",
  "17:00", "17:45",
  "18:00", "18:45",
  "19:00", "19:45",
  "20:00", "20:45"
];

// Funzione per ottenere la data odierna in formato YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // mesi da 0 a 11
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Funzione per effettuare il login
async function login(type) {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert('Inserisci username e password.');
    return;
  }

  if (type === 'utente') {
    currentUser = username;
    document.getElementById('login-area').style.display = 'none';
    document.getElementById('app-area').style.display = 'flex';
    populateAllFields();
  } else if (type === 'admin') {
    if (username === 'admin' && password === 'passwordAdmin') {
      currentUser = username;
      document.getElementById('login-area').style.display = 'none';
      document.getElementById('app-area').style.display = 'flex';
      document.getElementById('admin-area').style.display = 'block';
      populateAllFields();
      populateAdminTable();
    } else {
      alert('Credenziali amministratore errate!');
    }
  }
}

// Funzione per effettuare il logout
function logout() {
  currentUser = null;
  document.getElementById('login-area').style.display = 'flex';
  document.getElementById('app-area').style.display = 'none';
}

// Funzione per ottenere gli slot di un campo
async function populateFieldSlots(fieldName) {
  const today = getTodayDate();
  const response = await fetch(`http://localhost:3000/api/slots?field=${fieldName}&date=${today}`);
  const slots = await response.json();

  const container = document.getElementById(`slots-${fieldName}`);
  container.innerHTML = '';

  timeSlots.forEach(slot => {
    const slotDiv = document.createElement('div');
    slotDiv.classList.add('slot');

    const booked = slots.find(s => s.time === slot);

    if (booked) {
      slotDiv.classList.add(booked.user === currentUser ? 'my-booking' : 'unavailable');
      slotDiv.textContent = `${slot} - Prenotato da ${booked.user}`;
      if (booked.user === currentUser) {
        slotDiv.onclick = () => cancellaPrenotazioneUtente(fieldName, slot);
      }
    } else {
      slotDiv.classList.add('available');
      slotDiv.textContent = `${slot} - Disponibile`;
      slotDiv.onclick = () => prenotaSlot(fieldName, slot);
    }

    container.appendChild(slotDiv);
  });
}

// Funzione per ottenere gli slot di tutti i campi
function populateAllFields() {
  populateFieldSlots("Volley1");
  populateFieldSlots("Volley2");
  populateFieldSlots("Basket/Calcio");
  populateFieldSlots("Ping-pong");
}

// Funzione per prenotare uno slot
async function prenotaSlot(fieldName, slot) {
  const today = getTodayDate();

  try {
    const response = await fetch('http://localhost:3000/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: fieldName,
        date: today,
        time: slot,
        user: currentUser,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    alert(`Prenotazione effettuata: ${fieldName} alle ${slot}`);
    populateAllFields();
  } catch (error) {
    alert('Errore nella prenotazione');
  }
}

// Funzione per cancellare una prenotazione dell'utente corrente
async function cancellaPrenotazioneUtente(fieldName, slot) {
  const today = getTodayDate();

  try {
    const response = await fetch('http://localhost:3000/api/slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: fieldName,
        date: today,
        time: slot,
        user: currentUser,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    alert(`Prenotazione cancellata: ${fieldName} alle ${slot}`);
    populateAllFields();
  } catch (error) {
    alert('Errore nella cancellazione');
  }
}

// Funzione per popolare la tabella admin
async function populateAdminTable() {
  const today = getTodayDate();
  const response = await fetch(`http://localhost:3000/api/slots?date=${today}`);
  const slots = await response.json();

  const adminTableBody = document.getElementById('admin-table');
  adminTableBody.innerHTML = '';

  slots.forEach(slot => {
    const tr = document.createElement('tr');

    const tdCampo = document.createElement('td');
    tdCampo.textContent = slot.field;
    tr.appendChild(tdCampo);

    const tdData = document.createElement('td');
    tdData.textContent = slot.date;
    tr.appendChild(tdData);

    const tdOrario = document.createElement('td');
    tdOrario.textContent = slot.time;
    tr.appendChild(tdOrario);

    const tdUtente = document.createElement('td');
    tdUtente.textContent = slot.user;
    tr.appendChild(tdUtente);

    const tdAzioni = document.createElement('td');
    const btnAnnulla = document.createElement('button');
    btnAnnulla.textContent = 'Annulla';
    btnAnnulla.classList.add('cancel-btn');
    btnAnnulla.onclick = () => cancellaPrenotazioneAdmin(slot.field, slot.date, slot.time);
    tdAzioni.appendChild(btnAnnulla);
    tr.appendChild(tdAzioni);

    adminTableBody.appendChild(tr);
  });
}

// Funzione per cancellare una prenotazione come admin
async function cancellaPrenotazioneAdmin(field, date, timeSlot) {
  try {
    const response = await fetch('http://localhost:3000/api/slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: field,
        date: date,
        time: timeSlot,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    alert(`Prenotazione annullata da Admin: ${field}, ${date}, ${timeSlot}`);
    populateAllFields();
    populateAdminTable();
  } catch (error) {
    alert('Errore nella cancellazione');
  }
}
