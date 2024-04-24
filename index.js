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

function populateDetailsPane(provider) {
  const pane = document.getElementById("provider-details");

  // Set Name
  if (provider.name) {
    document.getElementById("data-provider-name").innerText = provider.name;
  }

  // Set Intro
  if (provider.intro) {
    document.getElementById("data-provider-intro").innerText = provider.intro;
  }

  // Set Website
  if (provider.website) {
    document.getElementById("data-provider-website").href = provider.website;
  }

  // Set Location

  // Set Phone
  if (provider.phone) {
    document.getElementById("data-provider-phone").href = provider.website;
  }

  // Set Since
  if (provider.gsSince) {
    document.getElementById("data-provider-since-general").innerText =
      provider.gsSince;
  }
  if (provider.gasSince) {
    document.getElementById("data-provider-since-gender").innerText =
      provider.gasSince;
  }

  // Set Affiliations
  if (provider.affiliations) {
    document.getElementById("data-provider-affiliations").innerText =
      provider.affiliations;
  } else {
    document
      .getElementById("section-provider-affiliations")
      .classList.add("hidden");
  }

  // Set Identities
  if (provider.additionalIdentity) {
    document.getElementById("data-provider-identities").innerText =
      provider.additionalIdentity;
  } else {
    document
      .getElementById("section-provider-identities")
      .classList.add("hidden");
  }

  // Set Financial
  if (provider.financial) {
    document.getElementById("data-provider-finance").innerText =
      provider.website;
  } else {
    document.getElementById("section-provider-finance").classList.add("hidden");
  }

  // Set Trainings
  if (provider.training) {
    document.getElementById("data-provider-training").innerText =
      provider.website;
  } else {
    document
      .getElementById("section-provider-training")
      .classList.add("hidden");
  }

  // Set Cultural Competency
  if (provider.cultural) {
    document.getElementById("data-provider-culture").innerText =
      provider.website;
  } else {
    document.getElementById("section-provider-culture").classList.add("hidden");
  }

  // Set Additional Information
  if (provider.additionalInformation) {
    document.getElementById("data-provider-additional").innerText =
      provider.additionalInformation;
  } else {
    document
      .getElementById("section-provider-additional")
      .classList.add("hidden");
  }
}

function populateListPane() {
  const pane = document.getElementById("provider-list");

  pane.innerHTML = "";

  for (let provider of providers) {
    const listItem = document.createElement("div");
    listItem.classList.add("provider-list-item");
    listItem.onclick = () => {
      populateDetailsPane(provider);
      map.setCenter(provider.marker.position);
    };

    const name = document.createElement("label");
    name.innerText = provider.name;

    listItem.appendChild(name);

    const inPerson = document.createElement("p");
    inPerson.innerText = "In Person for ...";

    listItem.appendChild(inPerson);

    const virtual = document.createElement("p");
    virtual.innerText = "Virtual for ...";

    listItem.appendChild(virtual);

    pane.appendChild(listItem);
  }
}

loadProviders();

document.getElementById("test-refresh").onclick = populateListPane;
//loadXLSX();
