// src/js/index.js

// ===========================
// Variables y constantes
// ===========================
const songList = document.querySelector('.main-content');
const scrollY = document.querySelector('.scrollY');
const currentMusic = document.querySelector('.currentMusic');
const playButton = document.querySelector('.play-button');
const pauseTopButton = document.querySelector('.user-controls .pause-button');
const progressBar = document.querySelector('.progress-bar');
const currentTime = document.querySelector('.time.current');
const totalTime = document.querySelector('.time.total');
const volumeBar = document.querySelector('.volume-bar');
const volumeBarFill = document.querySelector('.volume-bar-fill');
const volumeIcons = document.querySelectorAll('.volume-controls i');
const addButton = document.querySelector('.add-button');
const modal = document.getElementById("addMusicModal");
const btn = document.getElementById("add-button");
const cancelBtn = document.getElementById("boton-close");
const addMusicForm = document.getElementById("addMusicForm");
const nextButton = document.querySelector('.next-button');
const prevButton = document.querySelector('.prev-button');
const randomButton = document.querySelector('.random-button');
const loopButton = document.querySelector('.loop-button');
const filterLinks = document.querySelectorAll('.filtros-list li');

// Variables para los campos del formulario
const titleInput = document.getElementById('title');
const artistInput = document.getElementById('artist');
const musicFile = document.getElementById('musicFile');
const coverImage = document.getElementById('coverImage');

// Usamos un archivo JSON local en lugar de un servidor remoto.
const songsAPI = './src/songs/songs.json';

let currentSong = null;
let currentAudio = null;
let isPlaying = false;
let volume = 0.5;
let isLooping = false;
let isRandomMode = false;
let allSongsList = [];

// ===========================
// Funciones para cargar canciones
// ===========================
function loadSongs() {
  let storedSongs = localStorage.getItem('songsList');
  return storedSongs ? JSON.parse(storedSongs) : null;
}

function fetchSongs() {
  let songs = loadSongs();
  if (songs) {
    allSongsList = songs;
    processSongs(songs);
    updateFilteredSongList();
  } else {
    fetch(songsAPI)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP! estado: ${response.status}`);
        }
        return response.json();
      })
      .then(songs => {
        localStorage.setItem('songsList', JSON.stringify(songs));
        allSongsList = songs;
        processSongs(songs);
        updateFilteredSongList();
      })
      .catch(error => {
        console.error("Error loading songs:", error.message);
        if (scrollY) {
          scrollY.innerHTML = `<div style="color: red;">Error loading songs: ${error.message}</div>`;
        }
      });
  }
}

// ===========================
// Configuración de controles
// ===========================
function setupControlEvents() {
  playButton.addEventListener('click', handlePlayPause);
  // Agregamos stopPropagation al controlador del botón superior
  pauseTopButton.addEventListener('click', (e) => {
    e.stopPropagation();
    handlePlayPause();
  });

  function handlePlayPause() {
    if (currentSong) {
      togglePlayPause();
    }
  }

  nextButton.addEventListener('click', playNextSong);
  prevButton.addEventListener('click', playPreviousSong);
  randomButton.addEventListener('click', toggleRandomMode);
  loopButton.addEventListener('click', toggleLoopMode);

  filterLinks.forEach((link) => {
    link.addEventListener('click', () => {
      filterLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updateFilteredSongList();
    });
  });
}

function getSongsList() {
  const favoriteSongsLink = filterLinks[1];
  let songsList = allSongsList;
  if (favoriteSongsLink.classList.contains('active')) {
    songsList = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
  }
  return songsList;
}

function playNextSong() {
  const songsList = getSongsList();
  if (!songsList.length) return;
  let nextIndex;
  if (isRandomMode) {
    nextIndex = Math.floor(Math.random() * songsList.length);
  } else {
    const currentIndex = songsList.findIndex(song => song.id === currentSong.id);
    nextIndex = (currentIndex + 1) % songsList.length;
  }
  playSong(songsList[nextIndex]);
}

function playPreviousSong() {
  const songsList = getSongsList();
  if (!songsList.length) return;
  let prevIndex;
  if (isRandomMode) {
    prevIndex = Math.floor(Math.random() * songsList.length);
  } else {
    const currentIndex = songsList.findIndex(song => song.id === currentSong.id);
    prevIndex = (currentIndex - 1 + songsList.length) % songsList.length;
  }
  playSong(songsList[prevIndex]);
}

function toggleRandomMode() {
  isRandomMode = !isRandomMode;
  randomButton.classList.toggle('active', isRandomMode);
}

function toggleLoopMode() {
  isLooping = !isLooping;
  loopButton.classList.toggle('active', isLooping);
}

function handleSongEnd() {
  if (isLooping) {
    currentAudio.currentTime = 0;
    currentAudio.play();
  } else {
    playNextSong();
  }
}

// ===========================
// Creación de elementos de canción
// ===========================
function createSongItem(song) {
  const songItem = document.createElement('div');
  songItem.classList.add('song-item');
  songItem.dataset.songData = JSON.stringify(song);

  const playIconSpan = document.createElement('span');
  playIconSpan.classList.add('play-icon');

  const playIcon = document.createElement('box-icon');
  playIcon.setAttribute('name', 'play-circle');
  playIcon.setAttribute('color', '#1db954');
  playIcon.classList.add('playSong');
  playIconSpan.appendChild(playIcon);

  const titleSpan = document.createElement('span');
  titleSpan.classList.add('title');
  titleSpan.textContent = song.title;

  const artistSpan = document.createElement('span');
  artistSpan.classList.add('artist');
  artistSpan.textContent = song.artist;

  const durationSpan = document.createElement('span');
  durationSpan.classList.add('duration');

  const audio = new Audio(song.filepath);
  audio.addEventListener('loadedmetadata', () => {
    durationSpan.textContent = formatTime(audio.duration);
  });

  const favSpan = document.createElement('span');
  favSpan.classList.add('favorite-icon');

  const delSpan = document.createElement('span');
  delSpan.classList.add('delete-icon');

  const fav = document.createElement('box-icon');
  fav.setAttribute('name', 'heart');
  fav.setAttribute('color', '#1db954');

  const deltree = document.createElement('box-icon');
  deltree.setAttribute('name', 'trash');
  deltree.setAttribute('color', '#ffffff');
  deltree.setAttribute('id', 'testdel');

  const favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
  const isFavorite = favoriteSongs.some(favSong => favSong.id === song.id);
  songItem.dataset.isFavorite = isFavorite.toString();
  if (isFavorite) {
    fav.setAttribute('type', 'solid');
  }

  fav.addEventListener('click', (e) => {
    let favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    if (songItem.dataset.isFavorite === 'false') {
      songItem.dataset.isFavorite = 'true';
      fav.setAttribute('type', 'solid');
      favoriteSongs.push(song);
    } else {
      songItem.dataset.isFavorite = 'false';
      fav.setAttribute('type', 'regular');
      favoriteSongs = favoriteSongs.filter(favSong => favSong.id !== song.id);
    }
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
    updateFilteredSongList();
  });

  favSpan.appendChild(fav);
  delSpan.appendChild(deltree);

  songItem.append(playIconSpan, titleSpan, artistSpan, durationSpan, favSpan, deltree);

  songItem.addEventListener('click', (e) => {
    if (e.target.closest('.play-icon')) return;
    selectSong(song);
    playSong(song);
  });


  playIconSpan.addEventListener('click', (e) => {
    selectSong(song);
    playSong(song);
  });

  deltree.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteSong(song);
  });

  return songItem;
}

function deleteSong(song) {
  const confirmDelete = confirm(`Are you sure you want to delete the song "${song.title}"?`);
  if (confirmDelete) {
    allSongsList = allSongsList.filter(s => s.id !== song.id);
    localStorage.setItem('songsList', JSON.stringify(allSongsList));
    let favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    favoriteSongs = favoriteSongs.filter(s => s.id !== song.id);
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
    processSongs(allSongsList);
    alert(`Song "${song.title}" has been deleted.`);
  }
}

function updateFilteredSongList() {
  const favoriteSongsLink = filterLinks[1];
  const shortSongsLink = filterLinks[2];
  const longSongsLink = filterLinks[3];

  if (favoriteSongsLink.classList.contains('active')) {
    const favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    const allSongItems = scrollY.querySelectorAll('.song-item');
    allSongItems.forEach(songItem => {
      const songData = JSON.parse(songItem.dataset.songData);
      songItem.style.display = favoriteSongs.some(favSong => favSong.id === songData.id) ? '' : 'none';
    });
  } else if (shortSongsLink.classList.contains('active')) {
    scrollY.querySelectorAll('.song-item').forEach(songItem => {
      const songData = JSON.parse(songItem.dataset.songData);
      const audio = new Audio(songData.filepath);
      audio.addEventListener('loadedmetadata', () => {
        songItem.style.display = audio.duration < 180 ? '' : 'none';
      });
    });
  } else if (longSongsLink.classList.contains('active')) {
    scrollY.querySelectorAll('.song-item').forEach(songItem => {
      const songData = JSON.parse(songItem.dataset.songData);
      const audio = new Audio(songData.filepath);
      audio.addEventListener('loadedmetadata', () => {
        songItem.style.display = audio.duration >= 180 ? '' : 'none';
      });
    });
  } else {
    scrollY.querySelectorAll('.song-item').forEach(songItem => {
      songItem.style.display = '';
    });
  }
}

function selectSong(song) {
  const previousSelected = document.querySelector('.song-item.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }
  const songItems = document.querySelectorAll('.song-item');
  songItems.forEach((item) => {
    const songData = JSON.parse(item.dataset.songData);
    if (songData.id === song.id) {
      item.classList.add('selected');
    }
  });
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentSong = song;
  currentMusic.innerHTML = `<div class="song-info">
      <img id="coverInfo" src="${song.cover}" alt="${song.title}">
    </div>`;
  document.querySelector('.current-song .song-info').innerHTML =
    `<div class="song-name">${song.title}</div>
    <div class="artist-name">${song.artist}</div>`;
  isPlaying = false;
  updatePlayPauseButton(false);
}

function togglePlayPause() {
  if (!currentSong) return;

  if (!currentAudio) {
    playSong(currentSong);
  } else if (currentAudio.paused) {
    currentAudio.play();
    isPlaying = true;
  } else {
    currentAudio.pause();
    isPlaying = false;
  }

  updatePlayPauseButton(isPlaying);
}

function playSong(song) {
  console.log('Reproduciendo canción:', song);
  if (currentAudio) {
    currentAudio.pause();
  }
  selectSong(song);
  currentAudio = new Audio(song.filepath);
  currentAudio.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(currentAudio.duration);
    currentAudio.play()
      .then(() => {
        isPlaying = true;
        updatePlayPauseButton(true);
      })
      .catch((error) => {
        console.error('Error reproduciendo la canción:', error);
        isPlaying = false;
        updatePlayPauseButton(false);
      });
  });
  currentAudio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    alert('Error reproduciendo la canción. Inténtalo de nuevo.');
    isPlaying = false;
    updatePlayPauseButton(false);
  });
  currentAudio.addEventListener('ended', handleSongEnd);
  currentAudio.addEventListener('timeupdate', () => {
    if (currentAudio && currentAudio.duration) {
      const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
      progressBar.value = progress;
      currentTime.textContent = formatTime(currentAudio.currentTime);
    }
  });
  currentAudio.volume = volume;
}

function updatePlayPauseButton(playing) {
  // Actualiza el icono del botón inferior:
  playButton.querySelector('box-icon').setAttribute('name', playing ? 'pause-circle' : 'play-circle');
  // Actualiza el texto del botón superior:
  if (pauseTopButton) {
    pauseTopButton.textContent = playing ? 'PAUSE' : 'PLAY';
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ===========================
// Barra de progreso y volumen
// ===========================
progressBar.addEventListener('mousedown', (e) => {
  const rect = progressBar.getBoundingClientRect();
  const handleMouseMove = (e) => {
    const progress = ((e.clientX - rect.left) / rect.width) * 100;
    progressBar.value = progress;
    updateCurrentTime(progress);
    if (currentAudio && currentAudio.duration) {
      currentAudio.currentTime = (progress / 100) * currentAudio.duration;
    }
  };
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMouseMove));
});

function updateCurrentTime(progress) {
  if (currentAudio && currentAudio.duration) {
    currentTime.textContent = formatTime((progress / 100) * currentAudio.duration);
  }
}

volumeBar.addEventListener('mousedown', (e) => {
  const rect = volumeBar.getBoundingClientRect();
  const handleMouseMove = (e) => {
    let newVolume = (e.clientX - rect.left) / rect.width;
    newVolume = Math.max(0, Math.min(1, newVolume));
    updateVolume(newVolume);
  };
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', handleMouseMove);
  });
});

function updateVolume(value) {
  volume = value;
  updateVolumeBar();
  if (currentAudio) {
    currentAudio.volume = volume;
  }
}

function updateVolumeBar() {
  volumeBarFill.style.width = `${volume * 100}%`;
  let iconName;
  if (volume === 0) {
    iconName = 'volume-mute';
  } else if (volume < 0.5) {
    iconName = 'volume-low';
  } else {
    iconName = 'volume-full';
  }
  const volumeIcon = document.querySelector('.volume-controls box-icon');
  volumeIcon.setAttribute('name', iconName);
  volumeIcon.setAttribute('color', '#ffffff');
}

volumeBar.addEventListener('click', (e) => {
  const newVolume = (e.clientX - volumeBar.getBoundingClientRect().left) / volumeBar.getBoundingClientRect().width;
  updateVolume(newVolume);
});

volumeIcons.forEach(icon => {
  icon.addEventListener('click', () => {
    if (icon.classList.contains('bx-volume-full')) {
      updateVolume(0);
    } else if (icon.classList.contains('bx-volume-low')) {
      updateVolume(0.25);
    } else {
      updateVolume(1);
    }
  });
});

// ===========================
// Manejo de modales y formularios
// ===========================
btn.onclick = () => modal.style.display = "block";
cancelBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

const validateTitle = (title) => {
  const trimmedTitle = title.trim();
  if (trimmedTitle === '') {
    return 'El título no puede estar vacío';
  } else if (trimmedTitle.length > 20) {
    return 'El título no puede superar 20 caracteres';
  } else if (!/^[A-Za-z\s]+$/.test(trimmedTitle)) {
    return 'El título solo puede contener letras y espacios';
  } else {
    return '';
  }
};

const validateArtist = (artist) => {
  const trimmedArtist = artist.trim();
  if (trimmedArtist === '') {
    return 'El artista no puede estar vacío';
  } else if (trimmedArtist.length > 20) {
    return 'El artista no puede superar 20 caracteres';
  } else if (!/^[A-Za-z\s]+$/.test(trimmedArtist)) {
    return 'El artista solo puede contener letras y espacios';
  } else {
    return '';
  }
};

function showError(inputElement, errorMessage) {
  const existingError = inputElement.nextElementSibling;
  if (existingError && existingError.classList.contains('error-message')) {
    existingError.remove();
  }
  const errorElement = document.createElement('div');
  errorElement.classList.add('error-message');
  errorElement.textContent = errorMessage;
  inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach(error => error.remove());
}

addMusicForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  const titleValue = titleInput.value.trim();
  const artistValue = artistInput.value.trim();

  const titleError = validateTitle(titleValue);
  if (titleError) {
    showError(titleInput, titleError);
    return;
  }
  const artistError = validateArtist(artistValue);
  if (artistError) {
    showError(artistInput, artistError);
    return;
  }
  if (!musicFile.files.length) {
    showError(musicFile, 'Debe seleccionar un archivo de música');
    return;
  }
  if (!coverImage.files.length) {
    showError(coverImage, 'Debe seleccionar una imagen de portada');
    return;
  }

  // Se simula el "upload" creando rutas basadas en el nombre del archivo
  const musicFileName = musicFile.files[0].name;
  const coverFileName = coverImage.files[0].name;
  const newSong = {
    id: Date.now(),
    title: titleValue,
    artist: artistValue,
    cover: `./src/songs/${coverFileName}`,
    filepath: `./src/songs/${musicFileName}`
  };

  let songs = loadSongs() || [];
  songs.push(newSong);
  localStorage.setItem('songsList', JSON.stringify(songs));

  alert("¡La canción se subió correctamente!");
  modal.style.display = "none";
  addMusicForm.reset();
  allSongsList = songs;
  processSongs(songs);
});

// Validación en tiempo real
[titleInput, artistInput].forEach(input => {
  input.addEventListener('input', () => {
    const error = input === titleInput
      ? validateTitle(titleInput.value.trim())
      : validateArtist(artistInput.value.trim());
    if (error) {
      showError(input, error);
    } else {
      const existingError = input.nextElementSibling;
      if (existingError && existingError.classList.contains('error-message')) {
        existingError.remove();
      }
    }
  });
});

function processSongs(songs) {
  allSongsList = songs;
  scrollY.innerHTML = '';
  songs.forEach(song => {
    const songItem = createSongItem(song);
    scrollY.appendChild(songItem);
  });
}

function sortByArtist() {
  const songsList = getSongsList();
  if (isAscending) {
    songsList.sort((a, b) => a.artist.localeCompare(b.artist));
  } else {
    songsList.sort((a, b) => b.artist.localeCompare(a.artist));
  }
  updateSongList(songsList);
  isAscending = !isAscending;
}

const artistHeader = document.getElementById('artistHeader');
let isAscending = true;
artistHeader.addEventListener('click', sortByArtist);

function updateSongList(songs) {
  scrollY.innerHTML = '';
  songs.forEach(song => {
    const songItem = createSongItem(song);
    scrollY.appendChild(songItem);
  });
}

document.getElementById('editUser').addEventListener('click', function () {
  const users = JSON.parse(localStorage.getItem('userList')) || [];
  const userModalClose = document.getElementById('user-modal-close');
  const editModal = document.getElementById('editUserModal');
  const userSelect = document.getElementById('userSelect');
  const editUserForm = document.getElementById('editUserForm');
  const newNameInput = document.getElementById('newName');

  userModalClose.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == editModal) {
      editModal.style.display = 'none';
    }
  });

  userSelect.innerHTML = '';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.text = user.username;
    userSelect.add(option);
  });

  document.getElementById('editUserModal').style.display = 'block';

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  editModal.appendChild(closeBtn);

  closeBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  editUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedUserId = parseInt(userSelect.value);
    const newName = newNameInput.value.trim();
    if (!newName) {
      alert('Por favor, introduce un nombre.');
      return;
    }
    confirm('¿Estás seguro de que quieres modificar el nombre de usuario por ' + newName + '?');
    const updatedUsers = users.map(user =>
      user.id === selectedUserId ? { ...user, username: newName } : user
    );
    localStorage.setItem('userList', JSON.stringify(updatedUsers));
    const userElement = document.getElementById('user');
    const userSpan = userElement.querySelector('.userMargin');
    userSpan.textContent = newName;
    alert('Usuario actualizado correctamente.');
    editModal.style.display = 'none';
  });
});

const closeButton = document.querySelector('.close-button');
closeButton.addEventListener('click', () => {
  window.close();
});

const searchInput = document.querySelector('.search-bar');
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm.length < 2) {
    const songItems = scrollY.querySelectorAll('.song-item');
    songItems.forEach(songItem => {
      songItem.style.display = '';
    });
    return;
  }
  const songItems = scrollY.querySelectorAll('.song-item');
  songItems.forEach(songItem => {
    const songData = JSON.parse(songItem.dataset.songData);
    const title = songData.title.toLowerCase();
    const match = title.includes(searchTerm);
    songItem.style.display = match ? '' : 'none';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  fetchSongs();
  setupControlEvents();
});
