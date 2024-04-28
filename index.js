// Initialize and add the map
let map;

let providers;
let countries;
let us_states;
let ca_provinces;
let markers = [];

const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const { Map } = await google.maps.importLibrary("maps");

$(".multi-select").chosen({
  display_selected_options: false,
  width: "200px",
});

$(".chosen-select").chosen({
  disable_search: true,
  width: "100px",
});

$(".multi-select").on("change", function (e) {
  generateMarkers(map);
});

$(".chosen-select").on("change", function (e) {
  generateMarkers(map);
});

$("#opt_state_chosen").hide();
$("#opt_province_chosen").hide();

$("#opt-country")
  .chosen()
  .change(function () {
    var selectedValue = $(this).val();

    const us_states = $("#opt_state_chosen");
    const ca_provinces = $("#opt_province_chosen");

    if (selectedValue == "US") {
      us_states.show();
      ca_provinces.hide();
    } else if (selectedValue == "CA") {
      us_states.hide();
      ca_provinces.show();
    } else {
      us_states.hide();
      ca_provinces.hide();
    }
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
  const isTrainer = $("#opt-trainer").val() == "true";
  const area = $("#opt-area").val();
  const number = $("#opt-number").val();
  const modality = $("#opt-modality").val();
  const state = $("#opt-state").val();

  return {
    isTrainer: isTrainer,
    area: area,
    number: number,
    modality: modality,
    state: state,
  };
}

function providerMatchesQuery(provider, query) {
  //console.log(query)
  if (query.isTrainer != null) {
    if (provider.isTrainer != query.isTrainer) {
      //console.log("cancelled")
      return false;
    }
  }

  /*if (query.area.length > 0) {
    for (let opt of query.area) {
      if (!(provider.professionalAreas.includes(opt))) {
        return false;
      }
    }
  }*/

  if (query.number != null && query.modality != null) {
    if (query.number == "individual") {
      if (query.modality == "inperson") {
        if (!provider.numberModality.includes("IndividualTraining-InPerson")) {
          return false;
        }
      } else {
        if (!provider.numberModality.includes("IndividualTraining-Virtual")) {
          return false;
        }
      }
    } else {
      if (query.modality == "inperson") {
        if (!provider.numberModality.includes("GroupTraining-InPerson")) {
          return false;
        }
      } else {
        if (!provider.numberModality.includes("GroupTraining-Virtual")) {
          return false;
        }
      }
    }
  }

  if (query.state) {
    if (
      !(provider.virtualLocations.includes(query.state) || query.state == "any")
    ) {
      //return false;
    }
  }

  return true;
}

function generateMarkers(map) {
  removeAllMarkers(map);

  const query = buildQuery();
  let validProviders = [];

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

function populateListPane(validProviders) {
  const pane = document.getElementById("provider-list");

  pane.innerHTML = "";

  for (let provider of validProviders) {
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
