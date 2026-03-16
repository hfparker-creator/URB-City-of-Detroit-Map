const map = L.map('map').setView([42.3314, -83.0458], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('data/resources.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      onEachFeature: function(feature, layer) {
        const props = feature.properties;
        let popupContent = `<strong>${props.name || 'Unnamed resource'}</strong>`;

        if (props.category) {
          popupContent += `<br>Category: ${props.category}`;
        }

        if (props.source) {
          popupContent += `<br><a href="${props.source}" target="_blank">Source</a>`;
        }

        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error('Error loading GeoJSON:', error);
  });