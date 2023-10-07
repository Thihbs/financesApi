const express = require('express');
const bodyParser = require('body-parser');
const admin = require('./firebaseConfig'); // Importe a configuração do Firebase
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Rota para criar uma entrada financeira para um usuário
app.post('/api/finance/:userId', (req, res) => {
  const userId = req.params.userId;
  const { tipo, valor, categoria, data } = req.body;

  if (!tipo || !valor || !categoria || !data) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const financeRef = admin.database().ref(`finances/${userId}`);
  const newEntryRef = financeRef.push();
  const newEntry = {
    tipo,
    valor,
    categoria,
    data,
  };

  newEntryRef.set(newEntry, (error) => {
    if (error) {
      return res.status(500).json({ error: 'Error writing data to Firebase.' });
    }
    return res.status(201).json({ message: 'Finance entry created successfully.' });
  });
});

app.get('/api/checkUser/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required.' });
  }
  const financeRef = admin.database().ref(`finances/${userId}`);
  
  financeRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      financeRef.set(userId)
        .then(() => {
          return res.status(201).json({ message: 'New User Created' });
        })
        .catch((error) => {
          return res.status(500).json({ error: 'Error creating new user.' });
        });
    } else {
      return res.status(200).json({ message: 'User already exists.' });
    }
  });
});

app.get('/api/finance/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required.' });
  }
  const financeRef = admin.database().ref(`finances/${userId}`);
  financeRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(data);
  });
});

app.get('/api/finance/:userId/all', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required.' });
  }

  const financeRef = admin.database().ref(`finances/${userId}`);
  financeRef.once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Converta os dados em um array de objetos para responder
    const entries = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));

    return res.status(200).json(entries);
  });
});

app.get('/api/finances', (req, res) => {
  const usersRef = admin.database().ref('finances');
  usersRef.once('value', (snapshot) => {
    const usersData = snapshot.val();

    if (!usersData) {
      return res.status(404).json({ error: 'No finances found.' });
    }
    // Converta os dados em um array de objetos para responder
    const usersList = Object.keys(usersData).map((userId) => ({
      id: userId,
      ...usersData[userId],
    }));

    return res.status(200).json(usersList);
  });
});

// Rota para obter o total de receita e despesa para um usuário específico
app.get('/api/finances/total/:userId', (req, res) => {
  const userId = req.params.userId;
  const userFinancesRef = admin.database().ref(`finances/${userId}`);

  userFinancesRef.once('value', (snapshot) => {
    const userFinancesData = snapshot.val();

    if (!userFinancesData) {
      return res.status(404).json({ error: 'User not found or no finances found.' });
    }

    // Inicialize as variáveis para o total de receita e despesa
    let totalReceita = 0;
    let totalDespesa = 0;

    // Itere sobre as finanças do usuário específico
    Object.keys(userFinancesData).forEach((financeId) => {
      const finance = userFinancesData[financeId];

      // Verifique se a entrada financeira é uma receita ou despesa
      if (finance.tipo === 'Receita') {
        totalReceita += parseFloat(finance.valor);
      } else if (finance.tipo === 'Despesa') {
        totalDespesa += parseFloat(finance.valor);
      }
    });

    // Crie um objeto com os totais de receita e despesa
    const totalFinances = {
      totalReceita,
      totalDespesa,
    };

    return res.status(200).json(totalFinances);
  });
});

// Rota para obter o total de receita e despesa de todas as finanças
app.get('/api/finances/total', (req, res) => {
  const financesRef = admin.database().ref('finances');
  financesRef.once('value', (snapshot) => {
    const financesData = snapshot.val();
    if (!financesData) {
      return res.status(404).json({ error: 'No finances found.' });
    }

    // Inicialize as variáveis para o total de receita e despesa
    let totalReceita = 0;
    let totalDespesa = 0;

    // Itere sobre todas as finanças
    Object.keys(financesData).forEach((userId) => {
      const userFinances = financesData[userId];
      Object.keys(userFinances).forEach((financeId) => {
        const finance = userFinances[financeId];

        // Verifique se a entrada financeira é uma receita ou despesa
        if (finance.tipo === 'Receita') {
          totalReceita += parseFloat(finance.valor);
        } else if (finance.tipo === 'Despesa') {
          totalDespesa += parseFloat(finance.valor);
        }
      });
    });

    // Crie um objeto com os totais de receita e despesa
    const totalFinances = {
      totalReceita,
      totalDespesa,
    };

    return res.status(200).json(totalFinances);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  debugger;
});