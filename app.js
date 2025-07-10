// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const nicknameInput = document.getElementById('nickname');
const joinBtn = document.getElementById('join-btn');
const diceControls = document.querySelector('.dice-controls');
const rollBtn = document.getElementById('roll-btn');
const playersDiv = document.getElementById('players');
const historyDiv = document.getElementById('roll-history');

let currentUser = null;

// Join game
joinBtn.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (nickname) {
    currentUser = {
      id: Date.now().toString(),
      name: nickname
    };
    
    // Add user to Firebase
    database.ref('players/' + currentUser.id).set({
      name: nickname,
      online: true
    });
    
    // Show dice controls
    nicknameInput.style.display = 'none';
    joinBtn.style.display = 'none';
    diceControls.style.display = 'block';
    
    // Remove user when they leave
    window.addEventListener('beforeunload', () => {
      database.ref('players/' + currentUser.id).update({ online: false });
    });
  }
});

// Roll dice
rollBtn.addEventListener('click', () => {
  const diceType = parseInt(document.getElementById('dice-type').value);
  const diceCount = parseInt(document.getElementById('dice-count').value);
  const modifier = parseInt(document.getElementById('modifier').value);
  
  // Calculate rolls
  const rolls = [];
  let total = modifier;
  
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * diceType) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  // Save to Firebase
  const rollData = {
    player: currentUser.name,
    dice: `${diceCount}d${diceType}`,
    modifier: modifier !== 0 ? modifier : 0,
    rolls: rolls,
    total: total,
    timestamp: Date.now()
  };
  
  database.ref('rolls').push(rollData);
});

// Real-time player updates
database.ref('players').on('value', (snapshot) => {
  playersDiv.innerHTML = '';
  const players = snapshot.val() || {};
  
  Object.keys(players).forEach(key => {
    if (players[key].online) {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player';
      playerDiv.textContent = players[key].name;
      playersDiv.appendChild(playerDiv);
    }
  });
});

// Real-time roll updates
database.ref('rolls').limitToLast(10).on('child_added', (snapshot) => {
  const roll = snapshot.val();
  const rollDiv = document.createElement('div');
  rollDiv.className = 'roll-entry';
  
  // Format modifier display
  let modifierDisplay = '';
  if (roll.modifier > 0) {
    modifierDisplay = ` + ${roll.modifier}`;
  } else if (roll.modifier < 0) {
    modifierDisplay = ` - ${Math.abs(roll.modifier)}`;
  }
  
  rollDiv.innerHTML = `
    <strong>${roll.player}</strong> rolled 
    <strong>${roll.dice}${modifierDisplay}</strong>: 
    ${roll.rolls.join(', ')} = <strong>${roll.total}</strong>
    <small>${new Date(roll.timestamp).toLocaleTimeString()}</small>
  `;
  historyDiv.insertBefore(rollDiv, historyDiv.firstChild);
  
  // Keep only the last 10 rolls
  if (historyDiv.children.length > 10) {
    historyDiv.removeChild(historyDiv.lastChild);
  }
});