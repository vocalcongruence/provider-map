

// Initialize and add the map
let map;

let providers;
let countries;
let us_states;
let ca_provinces;
let markers = [];

const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const { Map } = await google.maps.importLibrary("maps");

$("#provider-list-show").on("click", function (e) {
  console.log("open")
    $("#provider-list").removeClass("collapsed");
})

$("#provider-list-close").on("click", function (e) {
  console.log("close")
  $("#provider-list").addClass("collapsed");
})

$(".multi-select").chosen({
  display_selected_options: false,
  width: "200px",
});

$(".chosen-select").chosen({
  disable_search: true,
  width: "200px",
});

$(".chosen-select-searchable").chosen({
  width: "150px",
});

$(".multi-select").on("change", function (e) {
  generateMarkers(map);
});

$(".chosen-select").on("change", function (e) {
  generateMarkers(map);
});

$(".chosen-select-searchable").on("change", function (e) {
  generateMarkers(map);
});

$("#provider-details-close").on("click", function (e) {
  $("#provider-details").hide();
})

$("#opt_state_chosen").hide();
$("#opt_province_chosen").hide();
$("#provider-details").hide();

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

function providerMatchesQuery(provider, query) {
  //console.log(query)
  if (query.isTrainer != null) {
    if (provider.isTrainer != query.isTrainer) {
      return false;
    }
  }

  if (query.area.length > 0) {
    let hasOne = false;
    for (let opt of provider.professionalAreas) {
      if (query.area.includes(opt)) {
        hasOne = true;
      }
    }

    if (!hasOne) {
      return false;
    }
  }

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

  if (query.country != null && query.country != '') {
    if (provider.country != query.country) {
      return false;
    }
  }

  if (query.state) {
    if (
      !(provider.virtualLocations.includes(query.state) || query.state == "any" || provider.state == query.state)
    ) {
      return false;
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
  const pane = $("#provider-details");

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

  // Set In Person Location
  if (provider.numberModality.includes("IndividualTraining-InPerson") || provider.numberModality.includes("GroupTraining-InPerson")) {
    let city = provider.city;
    let individual = (provider.numberModality.includes("IndividualTraining-InPerson")) ? "Individual" : "";
    let group = (provider.numberModality.includes("GroupTraining-InPerson")) ? "Group" : "";
    let divider = (individual != "" && group != "") ? "/" : "";

    document.getElementById("data-provider-location").innerText = "In Person - " + individual + divider + group + " (" + city + " " + provider.state + ", " + provider.country + ")";
  }

  // Set Virtual Location
  if (provider.numberModality.includes("IndividualTraining-Virtual") || provider.numberModality.includes("GroupTraining-Virtual")) {
    let individual = (provider.numberModality.includes("IndividualTraining-Virtual")) ? "Individual" : "";
    let group = (provider.numberModality.includes("GroupTraining-Virtual")) ? "Group" : "";
    let divider = (individual != "" && group != "") ? "/" : "";
    let stateString = provider.virtualLocations.join(", ");
    

    document.getElementById("data-provider-location-virtual").innerText = "Virtual - " + individual + divider + group + " (" + stateString + ")";
  }

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
      provider.financial;
  } else {
    document.getElementById("section-provider-finance").classList.add("hidden");
  }

  // Set Trainings
  if (provider.training) {
    document.getElementById("data-provider-training").innerText =
      provider.training;
  } else {
    document
      .getElementById("section-provider-training")
      .classList.add("hidden");
  }

  // Set Cultural Competency
  if (provider.cultural) {
    document.getElementById("data-provider-culture").innerText =
      provider.cultural;
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

  pane.show();
}

function populateListPane(validProviders) {
  const pane = document.getElementById("provider-list-scroll");

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

    if (provider.numberModality.includes("IndividualTraining-InPerson") || provider.numberModality.includes("GroupTraining-InPerson")) {
      const inPerson = document.createElement("p");
      
      let str = "In Person - ";

      if (provider.numberModality.includes("IndividualTraining-InPerson")) {
        str += "Individual ";
      }

      if (provider.numberModality.includes("GroupTraining-InPerson")) {
        str += "Group ";
      }

      inPerson.innerText = str;
      
      listItem.appendChild(inPerson);
    }

    if (provider.numberModality.includes("IndividualTraining-Virtual") || provider.numberModality.includes("GroupTraining-Virtual")) {
      const virtual = document.createElement("p");
      
      let str = "Virtual - ";

      if (provider.numberModality.includes("IndividualTraining-Virtual")) {
        str += "Individual ";
      }

      if (provider.numberModality.includes("GroupTraining-Virtual")) {
        str += "Group ";
      }

      virtual.innerText = str;
      
      listItem.appendChild(virtual);
    }


    pane.appendChild(listItem);
  }
}

loadProviders();

//document.getElementById("test-refresh").onclick = populateListPane;
//loadXLSX();
