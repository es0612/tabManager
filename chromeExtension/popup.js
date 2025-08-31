document.addEventListener('DOMContentLoaded', () => {
  const groupNameInput = document.getElementById('group-name');
  const saveGroupButton = document.getElementById('save-group');
  const groupsList = document.getElementById('groups-list');
  const notification = document.getElementById('notification');

  // Modal elements
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmYesButton = document.getElementById('confirm-yes');
  const confirmNoButton = document.getElementById('confirm-no');

  let confirmCallback = null;

  const deleteIconSvg = `
    <svg viewBox="0 0 24 24">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
    </svg>`;

  // --- Modal Logic ---
  function showConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex';
    confirmCallback = onConfirm;
  }

  function hideConfirmModal() {
    confirmModal.style.display = 'none';
    confirmCallback = null;
  }

  confirmYesButton.addEventListener('click', () => {
    if (confirmCallback) {
      confirmCallback();
    }
    hideConfirmModal();
  });

  confirmNoButton.addEventListener('click', () => {
    hideConfirmModal();
  });
  // --- End of Modal Logic ---


  // Show notification message
  function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = type; // success or error
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // Load and display saved groups
  function loadGroups() {
    chrome.storage.sync.get(null, (items) => {
      groupsList.innerHTML = '';
      for (const groupName in items) {
        const group = items[groupName];
        const groupItem = document.createElement('li');
        groupItem.className = 'group-item';

        const groupInfo = document.createElement('div');
        groupInfo.className = 'group-info';
        groupInfo.addEventListener('click', () => openGroup(groupName));

        const nameSpan = document.createElement('span');
        nameSpan.className = 'group-name';
        nameSpan.textContent = groupName;

        const tabCountSpan = document.createElement('span');
        tabCountSpan.className = 'tab-count';
        tabCountSpan.textContent = `${group.length} tab(s)`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-group';
        deleteButton.innerHTML = deleteIconSvg;
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteGroup(groupName);
        });

        groupInfo.appendChild(nameSpan);
        groupInfo.appendChild(tabCountSpan);
        groupItem.appendChild(groupInfo);
        groupItem.appendChild(deleteButton);
        groupsList.appendChild(groupItem);
      }
    });
  }

  // Save group function
  function saveGroup(groupName, urls) {
      chrome.storage.sync.set({ [groupName]: urls }, () => {
        groupNameInput.value = '';
        loadGroups();
        showNotification('Group saved successfully!');
      });
  }

  // Save button event listener
  saveGroupButton.addEventListener('click', () => {
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
      showNotification('Please enter a group name.', 'error');
      return;
    }

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const urls = tabs.map(tab => tab.url);
      // Check if group with the same name already exists
      chrome.storage.sync.get(groupName, (items) => {
        if (items[groupName]) {
          showConfirmModal(`Group "${groupName}" already exists. Overwrite it?`, () => {
            saveGroup(groupName, urls);
          });
        } else {
          saveGroup(groupName, urls);
        }
      });
    });
  });

  // Open all tabs in a group
  function openGroup(groupName) {
    chrome.storage.sync.get(groupName, (items) => {
      const urls = items[groupName];
      if (urls && urls.length > 0) {
        chrome.windows.create({ url: urls });
      }
    });
  }

  // Delete a group
  function deleteGroup(groupName) {
    showConfirmModal(`Are you sure you want to delete the group "${groupName}"?`, () => {
      chrome.storage.sync.remove(groupName, () => {
        loadGroups();
        showNotification('Group deleted.', 'success');
      });
    });
  }

  // Initial load
  loadGroups();
});