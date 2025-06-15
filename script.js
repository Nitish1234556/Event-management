// Load content dynamically into the main content area
function loadPage(page) {
  fetch(page)
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-content').innerHTML = html;

      if (page === 'events.html') {
        loadEvents();
      } else if (page === 'participants.html') {
        loadParticipants();
      } else if (page === 'notifications.html') {
        loadNotifications();
      }
    })
    .catch(err => {
      document.getElementById('main-content').innerHTML = "<p>Error loading content.</p>";
      console.error(err);
    });
}

// Load events from events.txt and display them with participate buttons
function loadEvents() {
  fetch('events.txt')
    .then(response => response.text())
    .then(data => {
      const events = data.trim().split('\n');
      const container = document.getElementById('event-container');
      if (!container) return;

      container.innerHTML = '';

      events.forEach((line, index) => {
        const [name, date, time, desc] = line.split('|');
        const eventKey = `event_${name.trim()}`;

        const div = document.createElement('div');
        div.classList.add('event');

        div.innerHTML = `
          <div class="event-details">
            <h3>${name}</h3>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p>${desc}</p>
          </div>
          <div class="event-action">
            <div class="form-row">
              <input type="text" placeholder="Your Name" id="name-input-${index}" />
              <button class="participate-btn" data-id="${eventKey}" data-input="name-input-${index}">Participate</button>
            </div>
          </div>
        `;

        container.appendChild(div);
      });

      document.querySelectorAll('.participate-btn').forEach(button => {
        button.addEventListener('click', e => {
          const key = e.target.getAttribute('data-id');
          const inputId = e.target.getAttribute('data-input');
          const name = document.getElementById(inputId).value.trim();

          if (!name) {
            alert("Please enter your name before participating.");
            return;
          }

          let participants = JSON.parse(localStorage.getItem(key)) || [];

          if (!participants.includes(name)) {
            participants.push(name);
            localStorage.setItem(key, JSON.stringify(participants));
            alert("Participation recorded!");
          } else {
            alert("You have already participated.");
          }
        });
      });
    })
    .catch(error => {
      const container = document.getElementById('event-container');
      if (container) container.innerText = "Error loading events.";
      console.error(error);
    });
}

// Load participants from localStorage and show them under each event
function loadParticipants() {
  fetch('events.txt')
    .then(response => response.text())
    .then(data => {
      const events = data.trim().split('\n');
      const container = document.getElementById('participants-container');
      if (!container) return;

      container.innerHTML = '';

      events.forEach((line, index) => {
        const [name] = line.split('|');
        const eventKey = `event_${name.trim()}`;
        const participants = JSON.parse(localStorage.getItem(eventKey)) || [];

        const div = document.createElement('div');
        div.classList.add('event');

        div.innerHTML = `
          <h3>${name}</h3>
          <p><strong>Total Participants:</strong> ${participants.length}</p>
          <ul>${participants.map(p => `<li>${p}</li>`).join('')}</ul>
        `;

        container.appendChild(div);
      });
    })
    .catch(error => {
      const container = document.getElementById('participants-container');
      if (container) container.innerText = "Error loading participants.";
      console.error(error);
    });
}

// Load notifications
function loadNotifications() {
  fetch('notifications.txt')
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const list = document.getElementById('notification-list');
      if (!list) return;

      list.innerHTML = '';
      lines.forEach(note => {
        const li = document.createElement('li');
        li.textContent = note;
        list.appendChild(li);
      });
    })
    .catch(err => {
      const list = document.getElementById('notification-list');
      if (list) list.innerHTML = "<li>Error loading notifications.</li>";
      console.error(err);
    });
}

// Setup nav click handlers and load default page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = e.target.getAttribute('href');
      loadPage(page);
    });
  });

  loadPage('home.html');
});

// ---------------------- TRIE STRUCTURE FOR SEARCH -----------------------
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (let ch of word.toLowerCase()) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }

  search(prefix) {
    let node = this.root;
    for (let ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    return this._collectAllWords(node, prefix);
  }

  _collectAllWords(node, prefix) {
    let results = [];
    if (node.isEnd) results.push(prefix);
    for (let ch in node.children) {
      results = results.concat(this._collectAllWords(node.children[ch], prefix + ch));
    }
    return results;
  }
}

const eventTrie = new Trie();

// Load event names into the Trie
function buildEventTrie() {
  fetch('events.txt')
    .then(res => res.text())
    .then(data => {
      const lines = data.trim().split('\n');
      lines.forEach(line => {
        const [name] = line.split('|');
        eventTrie.insert(name.trim());
      });
    })
    .catch(err => {
      console.error('Error loading events for Trie:', err);
    });
}

// Handle search suggestions
document.addEventListener('DOMContentLoaded', () => {
  buildEventTrie();

  const searchInput = document.getElementById('input');
  const suggestionBox = document.createElement('div');
  suggestionBox.className = 'suggestion-box';
  searchInput.parentNode.appendChild(suggestionBox);

  // Typing: show suggestions
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      suggestionBox.innerHTML = '';
      return;
    }

    const suggestions = eventTrie.search(query).slice(0, 5);
    suggestionBox.innerHTML = suggestions
      .map(word => `<div class="suggestion-item">${word}</div>`)
      .join('');
  });

  // Click on a suggestion
  suggestionBox.addEventListener('click', e => {
    if (e.target.classList.contains('suggestion-item')) {
      const selectedName = e.target.textContent.trim();
      searchInput.value = selectedName;
      suggestionBox.innerHTML = '';
      scrollToEventByName(selectedName);
    }
  });

  // Click on search icon
  const searchIcon = document.querySelector('.search-icon');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (!query) return;
      scrollToEventByName(query);
    });
  }

  // Hide suggestions if clicked outside
  document.addEventListener('click', e => {
    if (!suggestionBox.contains(e.target) && e.target !== searchInput) {
      suggestionBox.innerHTML = '';
    }
  });
});

// 🔁 Scroll and highlight helper
function scrollToEventByName(name) {
  loadPage('events.html');

  setTimeout(() => {
    const eventTitles = document.querySelectorAll('#event-container .event h3');
    for (const title of eventTitles) {
      if (title.textContent.trim().toLowerCase() === name.toLowerCase()) {
        const eventDiv = title.closest('.event');
        eventDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        eventDiv.style.backgroundColor = '#cce5ff'; // 🔵 darker light blue
        eventDiv.style.transition = 'background-color 0.4s ease';
        setTimeout(() => (eventDiv.style.backgroundColor = ''), 2000);
        break;
      }
    }
  }, 500);
}
