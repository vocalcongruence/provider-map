

// Initialize and add the map
let map;

let providers;
let countries;
let us_states;
let ca_provinces;
let markers = [];

const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const { Map } = await google.maps.importLibrary("maps");


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
  const isTrainer = $("#opt-trainer").val() == "true";
  const area = $("#opt-area").val();
  const number = $("#opt-number").val();
  const modality = $("#opt-modality").val();

  const country = $("#opt-country").val();

  let state;
  if (country == "US") {
    state = $("#opt-state").val();
  }
  else if (country == "CA") {
    state = $("#opt-province").val();
  }
  else {
    state = null;
  }
  

  return {
    isTrainer: isTrainer,
    area: area,
    number: number,
    modality: modality,
    country: country,
    state: state,
  };
}

function generateMarkers(map) {
  removeAllMarkers(map);

  const query = buildQuery();
  let validProviders = [];

  for (let provider of providers) {
    if (true || providerMatchesQuery(provider, query)) {
      const el = document.createElement("p");
      el.innerText = "Test Element";
      const marker = new AdvancedMarkerElement({
        map: map,
        position: provider.location,
        title: provider.name,
      });

      marker.addListener("click", () => {
        map.setZoom(8);
        map.setCenter(marker.position);

        populateDetailsPane(provider);
      });

      provider.marker = marker;
      validProviders.push(provider);
      markers.push(marker);
    }
  }

  populateListPane(validProviders);
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

//document.getElementById("test-refresh").onclick = populateListPane;
//loadXLSX();

/* 
----------------------------------------------------------------------------------------------------------------------
*/

function attachEvents() {
  $('#button-openLeftPanel').on('click', showLeftPanel);
  $('#button-closeLeftPanel').on('click', hideLeftPanel);
  $('#button-tabFilter').on('click', openTabFilter);
  $('#button-tabList').on('click', openTabList);
}

function showLeftPanel() {
  $('#panel-left').removeClass("hidden");
}

function hideLeftPanel() {
  $('#panel-left').addClass("hidden");
}

function showRightPanel() {

}

function hideRightPanel() {

}

function openTabFilter() {
  showLeftPanel();
  $('#panel-left-tabList').addClass("hidden");
  $('#panel-left-tabFilter').removeClass("hidden");
}

function openTabList() {
  showLeftPanel();
  $('#panel-left-tabFilter').addClass("hidden");
  $('#panel-left-tabList').removeClass("hidden");
}







attachEvents();