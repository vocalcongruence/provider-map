/*

Vocal Congruence Project - Provider Map
https://vocalcongruence.org/

v 1.0 - Initial Release
*/

import PROVIDER from "./provider.js";
import UI from "./ui.js";

const { Map } = await google.maps.importLibrary("maps");

// Initialize and add the map
let map;

// State
let trainers = [];
let surgeons = [];

// Helper Lists
let countries;
let all_countries;
let us_states;
let ca_provinces;
let languages;

async function initialize() {
  UI.renderFilters();
  //UI.showModal(false);

  await initializeMap();
  await loadData();

  // Build option lists from data
  createCountryOptions();
  createStateOptions();
  createProvinceOptions();
  createLanguageOptions();

  // Load initial dataset
  PROVIDER.generateProviders(map, trainers, surgeons, languages);

  attachEvents();
}

async function initializeMap() {
  map = new Map(document.getElementById("map"), {
    zoom: 5,
    center: { lat: 39.6414825, lng: -98.0441105 },
    mapId: "DEMO_MAP_ID",
    mapTypeId: "roadmap",
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    smoothZoom: true,
    smoothPan: true,
  });
}

async function loadData() {
  // Load output.json
  const outputResponse = await fetch("./data/output.json");
  const outputData = await outputResponse.json();

  trainers = outputData.trainers;
  surgeons = outputData.surgeons;
  countries = outputData.countries;
  languages = outputData.languages;

  // Load Countries List
  const countriesResponse = await fetch("./data/countries.json");
  all_countries = await countriesResponse.json();

  // Load US States List
  const statesResponse = await fetch("./data/us_states.json");
  us_states = await statesResponse.json();

  // Load CA Province List
  const provinceResponse = await fetch("./data/ca_provinces.json");
  ca_provinces = await provinceResponse.json();
}

function createCountryOptions() {
  const optgroup = document.getElementById("opt-country");

  for (let c of countries) {
    if (c in all_countries) {
      const el = document.createElement("option");
      el.value = c;
      el.innerText = all_countries[c];

      optgroup.appendChild(el);
    }
  }
}

function createStateOptions() {
  const optgroup = document.getElementById("opt-state");

  for (let s in us_states) {
    const el = document.createElement("option");
    el.value = s;
    el.innerText = us_states[s];

    optgroup.appendChild(el);
  }
}

function createProvinceOptions() {
  const optgroup = document.getElementById("opt-province");

  for (let p in ca_provinces) {
    const el = document.createElement("option");
    el.value = p;
    el.innerText = ca_provinces[p];

    optgroup.appendChild(el);
  }
}

function createLanguageOptions() {
  const optgroup = document.getElementById("opt-language");

  for (let l of languages) {
    const el = document.createElement("option");
    el.value = l.value;
    el.style = "text-transform: capitalize;";
    el.innerText = l.display;

    optgroup.appendChild(el);
  }
}

function attachEvents() {
  /////////////////////////////////////
  //               UI                //
  /////////////////////////////////////

  // Left panel
  $("#button-openLeftPanel-filter").on("click", () => {
    UI.showLeftPanel(true);
    UI.openTab(UI.TAB_FILTER);
  });
  $("#button-openLeftPanel-list").on("click", () => {
    UI.showLeftPanel(true);
    UI.openTab(UI.TAB_LIST);
  });
  $("#button-openLeftPanel-search").on("click", () => {
    UI.showLeftPanel(true);
    UI.openTab(UI.TAB_SEARCH);
  });
  $("#button-closeLeftPanel").on("click", () => {
    UI.showLeftPanel(false);
  });
  $("#button-tabFilter").on("click", () => {UI.openTab(UI.TAB_FILTER)});
  $("#button-tabList").on("click", () => {UI.openTab(UI.TAB_LIST)});
  $("#button-tabSearch").on("click", () => {UI.openTab(UI.TAB_SEARCH)});

  // Right Panel
  $("#button-closeRightPanel").on("click", () => {
    UI.showRightPanel(false);
  });

  // Help Modal
  $("#button-closeModal").on("click", (e) => {
    UI.showModal(false);
    e.stopPropagation(); 
  });

  $("#introModal").on("click", () => {
    UI.showModal(false);
  });

  $("#button-help").on("click", () => {
    UI.showModal(true);
  });
  $("#introModal > #content").on("click", (e) => {
    e.stopPropagation();  // Don't close modal if clicking within the content
  })


  /////////////////////////////////////
  //            Filters              //
  /////////////////////////////////////

  const onFilterChange = () => {
    PROVIDER.generateProviders(map, trainers, surgeons, languages);
    UI.renderFilters();
  };

  $(".filter").on("change", onFilterChange);

  $("#opt-providerType").on("change", () => {
    const val = $("#opt-providerType").val();

    if (val == UI.MODE_ANY) {
      $("#opt-providerType").attr("class", "filter mode-any")
    }
    else if (val == UI.MODE_TRAINERS) {
      $("#opt-providerType").attr("class", "filter mode-trainers")      
    }
    else if (val == UI.MODE_SURGEONS) {
      $("#opt-providerType").attr("class", "filter mode-surgeons")      
    }
  })

  // Filter resets
  $("#btn-reset-modality").on("click", () => {
    UI.resetModality();
    onFilterChange();
  });
  $("#btn-reset-number").on("click", () => {
    UI.resetNumber();
    onFilterChange();
  });
  $("#btn-reset-location").on("click", () => {
    UI.resetLocation();
    onFilterChange();
  });
  $("#button-resetAllFilters").on("click", () => {
    UI.resetAllFilters();
    onFilterChange();
  });
  $("#button-resetAllFilters-listView").on("click", () => {
    UI.resetAllFilters();
    onFilterChange();
  });

  /////////////////////////////////////
  //             Search              //
  /////////////////////////////////////
  
  $("#input-search").on(
    "input",
    PROVIDER.searchProviders.bind(null, map, trainers, surgeons, languages)
  );
}

initialize();
