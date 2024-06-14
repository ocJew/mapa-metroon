const firebaseConfig = {
    apiKey: "AIzaSyD7pS7KG4G1GvLHKrRWli23H6oUWTu4S24",
    authDomain: "mod-menu-e1b59.firebaseapp.com",
    projectId: "mod-menu-e1b59",
    storageBucket: "mod-menu-e1b59.appspot.com",
    messagingSenderId: "1022823108255",
    appId: "1:1022823108255:android:93c6cd293226a851889caa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let mapOptions = {
    minZoom: 13,
    maxZoom: 18,
    maxBounds: [
        [-3.72, -40.389], 
        [-3.65, -40.319]
    ],
    zoomControl: false,
    maxBoundsViscosity: 1.0 // Mantém o mapa dentro dos limites
}
const map = L.map('map', mapOptions).setView([-3.688, -40.35], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markerNorte, markerSul;
var northLayer = L.layerGroup().addTo(map);
var southLayer = L.layerGroup().addTo(map);
var SNLayer = L.layerGroup().addTo(map);

function addKMLTracks() {
    fetch('./metroon.kml') // Carregue o arquivo KML
    .then(response => response.text())
    .then(kmltext => {
        var parser = new DOMParser();
        var kml = parser.parseFromString(kmltext, 'text/xml');
        var northTracks = omnivore.kml.parse(kml, null, L.geoJson(null, {
            filter: function(feature) {
                return feature.properties && feature.properties.name && feature.properties.name.includes('Norte');
            },
            style: function (feature) {
                return {
                    color: '#0000FF',
                    weight: 5,
                    opacity: 0.5
                };
            },
            pointToLayer: function (geoJsonPoint, latlng) {
                return L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: './icons/blueball.png',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })
                }).bindPopup(geoJsonPoint.properties.name.replace(/^Estação\s+/i, ''));
            }
        }));
        var southTracks = omnivore.kml.parse(kml, null, L.geoJson(null, {
            filter: function(feature) {
                return feature.properties && feature.properties.name && feature.properties.name.includes('Sul');
            },
            style: function (feature) {
                return {
                    color: '#FF0000',
                    weight: 5,
                    opacity: 0.5
                };
            },
            pointToLayer: function (geoJsonPoint, latlng) {
                return L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: './icons/redball.png',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })
                }).bindPopup(geoJsonPoint.properties.name.replace(/^Estação\s+/i, ''));
            }
        }));
        northTracks.eachLayer(function(layer) {
            northLayer.addLayer(layer);
        });
        southTracks.eachLayer(function(layer) {
            southLayer.addLayer(layer);
        });
    });
}
addKMLTracks();

const formatDate = (date) => {
    const options = { day: '2-digit', month: '2-digit' };
    return new Date(date).toLocaleDateString('pt-BR', options);
};
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const metrosRefNorte = db.collection('locations_norte');
metrosRefNorte.orderBy('timestamp', 'desc').limit(1).onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    const data = doc.data();
    const latlng = [data.latitude, data.longitude];
    var popupContent = "<div style='text-align: center;'><b>VLT NORTE</b><br>";
    popupContent += isToday(data.timestamp.toDate()) ? "Hoje às " : "Dia " + formatDate(data.timestamp.toDate()) + " às ";
    popupContent += formatTime(data.timestamp.toDate());
    popupContent += "</div>";
    if (markerNorte) {
      markerNorte.setLatLng(latlng);
    } else {
      markerNorte = L.marker(latlng).addTo(northLayer).addTo(map).bindPopup(popupContent);
    }
    markerNorte.bindPopup(popupContent)
  });
});

const metrosRefSul = db.collection('locations_sul');
metrosRefSul.orderBy('timestamp', 'desc').limit(1).onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    const data = doc.data();
    const latlng = [data.latitude, data.longitude];
    var popupContent = "<div style='text-align: center;'><b>VLT SUL</b><br>";
    popupContent += isToday(data.timestamp.toDate()) ? "Hoje às " : "Dia " + formatDate(data.timestamp.toDate()) + " às ";
    popupContent += formatTime(data.timestamp.toDate());
    popupContent += "</div>";
    if (markerSul) {
      markerSul.setLatLng(latlng);
    } else {
      markerSul = L.marker(latlng).addTo(southLayer).addTo(map).bindPopup(popupContent);
    }
    markerSul.bindPopup(popupContent)
    document.getElementById('updateTimeSul').textContent = `Sul: ${new Date(data.timestamp.toDate()).toLocaleTimeString()}`;
  });
});





function toggleLayer(layer, show) {
    if (show) {
        if (!map.hasLayer(layer)) {
            map.addLayer(layer);
        }
    } else {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    }
}
document.getElementById('button-sul').addEventListener('click', function() {
    toggleLayer(northLayer, false);
    toggleLayer(southLayer, true);
    setActiveButton('button-sul');
    saveButtonState('button-sul');
});
document.getElementById('button-norte').addEventListener('click', function() {
    toggleLayer(northLayer, true);
    toggleLayer(southLayer, false);
    setActiveButton('button-norte');
    saveButtonState('button-norte');
});
document.getElementById('button-ambos').addEventListener('click', function() {
    map.setView([-3.685, -40.35], 13);
    toggleLayer(northLayer, true);
    toggleLayer(southLayer, true);
    setActiveButton('button-ambos');
    saveButtonState('button-ambos');
    setActiveButton('button-ambos');
    saveMapState();
});
function setActiveButton(buttonId) {
    document.querySelectorAll('.control-buttons button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(buttonId).classList.add('active');
}

// Função para iniciar a monitoração da posição do usuário
function watchUserLocation() {
    var blueIcon = L.icon({
        iconUrl: './icons/usuario.png',
        iconSize: [50, 50],
        iconAnchor: [25, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;
            L.marker([userLat, userLng], { icon: blueIcon }).addTo(SNLayer).bindPopup("Sua localização");
        }, function(error) {
            console.error('Erro ao obter localização:', error.message);
        },{
            enableHighAccuracy: true,  // Tenta obter uma posição mais precisa
            timeout: 10000,            // Tempo máximo para obter a localização em milissegundos
            maximumAge: 0,              // Aceita apenas posições recentes
        });
    } else {
        console.log('Geolocalização não é suportada pelo seu navegador.');
    }
}
// Chamada para iniciar a monitoração da posição do usuário
watchUserLocation();