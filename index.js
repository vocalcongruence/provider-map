// Initialize and add the map
let map;

let providers;
let markers = [];

const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const { Map } = await google.maps.importLibrary("maps");

$(".multi-select").chosen({
  display_selected_options: false,
  width: "200px",
});

$(".chosen-select").chosen({
  disable_search: true,
  width: "150px",
});

$(".multi-select").on("change", function (e) {
  generateMarkers(map);
});

$(".chosen-select").on("change", function (e) {
  generateMarkers(map);
});



async function initMap() {
  map = new Map(document.getElementById("map"), {
    zoom: 5,
    center: { lat: 39.6414825, lng: -98.0441105 },
    mapId: "DEMO_MAP_ID",
    mapTypeId: "roadmap",
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  });
}

function buildQuery() {
  const state = $("#opt-state").val();

  return {
    state: state,
  };
}

function providerMatchesQuery(provider, query) {
  if (query.state) {
    if (
      !(provider.virtualLocations.includes(query.state) || query.state == "any")
    ) {
      return false;
    }
  }

  return true;
}

function generateMarkers(map) {
  removeAllMarkers(map);

  const query = buildQuery();

  for (let provider of providers) {
    if (providerMatchesQuery(provider, query)) {
      const el = document.createElement('p');
      el.innerText = "Test Element";
      const marker = new AdvancedMarkerElement({
        map: map,
        position: provider.location,
        title: provider.name,
      });

      markers.push(marker);
    }
  }
}

function removeAllMarkers(map) {
  // Loop through each marker on the map
  markers.forEach((marker) => {
    // Remove the marker from the map
    marker.setMap(null);
  });

  // Clear the markers array
  markers = [];
}

function loadProviders() {
  fetch("./providers.json")
    .then((response) => response.json())
    .then((json) => {
      providers = json;

      initMap(providers).then(() => {
        generateMarkers(map);
      });
    });
}

loadProviders();
//loadXLSX();

