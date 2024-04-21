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

async function buildProviderJSON(data) {
  const workbook = XLSX.read(data, { type: "array" });

      // Convert the worksheet to JSON format
      const headers = [
        "Name",
        "Address",
        "Trainer_Surgeon",
        "Professional_Area",
        "Virtual_Locations",
        "Number_Modality",
        "Goals",
        "Languages",
        "Gender_Identity",
        "Intro",
        "General_Services_Since",
        "Gender_Affirming_Services_Since",
        "Affiliations",
        "Additional_Identity",
        "Financial_Information",
        "Website",
        "Phone",
        "Email",
        "Training",
        "Specialty",
        "Cultural_Comp",
        "Additional Information",
      ];

      const jsonData = XLSX.utils.sheet_to_json(
        workbook.Sheets["New Format - Trainer"],
        { header: headers }
      );
      const cleanJsonData = jsonData.filter(function (row) {
        if (row.Address == ', ' || row.Address == '') {
          return false;
        }

        return row.Name != null && row.Name != "" && row.Name != 'Name' && row.Name != 'Options';
      });

      providers = [];

      for (let key in cleanJsonData) {
        providers.push(cleanJsonData[key]);

        let latlong = geocodeAddress(cleanJsonData[key]['Address']).then(() => {
          providers[key].location = latlong;

          let provider = providers[key];
          console.log(provider)

          const marker = new AdvancedMarkerElement({
            map: map,
            position: provider.location,
            title: provider.name,
          });
    
          markers.push(marker);
        });
      }

      console.log(providers);

      initMap(providers).then(() => {
        //generateMarkers(map, providers);
      });
}

async function loadXLSX() {
  fetch("providers.xlsx")
    .then((response) => response.arrayBuffer())
    .then((data) => {
      buildProviderJSON(data)
      
    })
    .catch((error) => console.error("Error loading XLSX file:", error));
}

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
  return true;
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
    console.log(provider.location)
    if (providerMatchesQuery(provider, query)) {
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

async function geocodeAddress(address) {
  // Initialize the geocoder
  const geocoder = new google.maps.Geocoder();

  // Wrap the geocoding logic in a Promise
  return new Promise((resolve, reject) => {
    // Make a geocoding request
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK") {
        // Extract the latitude and longitude from the geocoding result
        const location = results[0].geometry.location;
        const latitude = location.lat();
        const longitude = location.lng();

        // Resolve the Promise with the latitude and longitude
        resolve({ latitude, longitude });
      } else {
        console.log('|' + address + '|')
        // Reject the Promise with an error message if geocoding fails
        reject(
          `Geocode was not successful for the following reason: ${status}`
        );
      }
    });
  });
}

function loadProviders() {
  fetch("./data.json")
    .then((response) => response.json())
    .then((json) => {
      providers = json.providers;

      initMap(providers).then(() => {
        generateMarkers(map);
      });
    });
}

//loadProviders();
loadXLSX();

