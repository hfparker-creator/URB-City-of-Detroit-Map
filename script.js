const map = L.map('map').setView([42.3314, -83.0458], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let allData = null;
let currentLayer = null;

function getColor(category) {
  if (category === 'community') return '#2e8b57';
  if (category === 'business') return '#1f78b4';
  if (category === 'public_resources') return '#ff8c00';
  if (category === 'transportation') return '#8a2be2';
  return '#666666';
}

function getSelectedCategories() {
  return Array.from(document.querySelectorAll('#controls input:checked')).map(input => input.value);
}

function formatCategory(category) {
  if (category === 'public_resources') return 'Public Resources';
  if (category === 'community') return 'Community';
  if (category === 'business') return 'Business';
  if (category === 'transportation') return 'Transportation';
  return category;
}

function formatPopup(properties) {
  let html = `<strong>${properties.name || 'Resource'}</strong>`;

  if (properties.category) {
    html += `<br>Category: ${formatCategory(properties.category)}`;
  }

  if (properties.description) {
    html += `<br>${properties.description}`;
  }

  if (properties.source) {
    html += `<br><a href="${properties.source}" target="_blank">Source</a>`;
  }

  return html;
}

function drawData() {
  if (!allData) return;

  const selectedCategories = getSelectedCategories();

  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  currentLayer = L.geoJSON(allData, {
    filter: function(feature) {
      return selectedCategories.includes(feature.properties.category);
    },
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 7,
        fillColor: getColor(feature.properties.category),
        color: '#222',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.85
      });
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(formatPopup(feature.properties));
    }
  }).addTo(map);
}

fetch('data/resources.geojson')
  .then(response => response.json())
  .then(data => {
    allData = data;
    drawData();
  })
  .catch(error => {
    console.error('GeoJSON failed to load:', error);
  });

document.querySelectorAll('#controls input').forEach(input => {
  input.addEventListener('change', drawData);
});