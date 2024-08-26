// Initialize and add the map
let map;

// State
let trainers = [];
let surgeons = [];
let markers = [];

let searchTrainers = true;

// Helper Lists

let providers;
let countries;
let us_states;
let ca_provinces;

const PROCEDURE_NAMES = {
  chond: "Chondrolaryngoplasty",
  wg: "Wendler's Glottoplasty",
  lava: "LAVA",
  criapp: "Cricothyroid Approximation",
  t3t: "Type 3 Thyroplasty",
  other: "Other",
};

const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
  "marker"
);
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

function generateMarkers() {
  removeAllMarkers(map);

  const query = providerQuery();
  let validProviders = [];

  const providerPool = searchTrainers ? trainers : surgeons;
  const color = searchTrainers ? "#cc87bf" : "#2872b8";
  const color2 = searchTrainers ? "#a35394" : "#0f4c85";

  for (let provider of providerPool) {
    if (providerMatchesQuery(provider, query)) {
      const pin = new PinElement({
        background: color,
        borderColor: color2,
        glyphColor: color2,
      });

      const marker = new AdvancedMarkerElement({
        map: map,
        position: provider.pin,
        title: provider.name,
        content: pin.element,
      });

      marker.addListener("click", () => {
        centerMarker(marker);

        if (searchTrainers) {
          loadTrainer(provider);
        } else {
          loadSurgeon(provider);
        }
        showRightPanel();
      });

      provider.marker = marker;
      validProviders.push(provider);
      markers.push(marker);
    }
  }

  validProviders.sort((a, b) => a["nameSort"].localeCompare(b["nameSort"]));

  loadProviderList(validProviders);
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
  fetch("./output.json")
    .then((response) => response.json())
    .then((json) => {
      trainers = json.trainers;
      surgeons = json.surgeons;

      loadCountries(json.countries);
      loadStates();
      loadProvinces();
      loadLanguages(json.languages);

      initMap().then(() => {
        generateMarkers();
      });
    });
}

showTrainerFilters();
loadProviders();

/* 
----------------------------------------------------------------------------------------------------------------------
*/

function attachEvents() {
  $("#button-openLeftPanel-filter").on("click", () => {
    showLeftPanel();
    openTabFilter();
  });
  $("#button-openLeftPanel-list").on("click", () => {
    showLeftPanel();
    openTabList();
  });
  $("#button-openLeftPanel-search").on("click", () => {
    showLeftPanel();
    openTabSearch();
  });

  $("#button-closeLeftPanel").on("click", hideLeftPanel);
  $("#button-closeRightPanel").on("click", hideRightPanel);

  $("#button-tabFilter").on("click", openTabFilter);
  $("#button-tabList").on("click", openTabList);
  $("#button-tabSearch").on("click", openTabSearch);

  $("#opt-profession").on("change", switchProfession);

  $("input").on("change", generateMarkers);
  $("#opt-country").on("change", generateMarkers);
  $("#opt-state").on("change", generateMarkers);
  $("#opt-province").on("change", generateMarkers);
  $("#opt-language").on("change", generateMarkers);
  $("#opt-procedure").on("change", generateMarkers);

  $("#btn-reset-modality").on("click", resetModality);
  $("#opt-modality-inPerson").on("click", onSelectModality);
  $("#opt-modality-virtual").on("click", onSelectModality);

  $("#btn-reset-number").on("click", resetNumber);
  $("#opt-number-individual").on("click", onSelectNumber);
  $("#opt-number-group").on("click", onSelectNumber);

  $("#button-resetAll").on("click", resetAllFilters);

  $("#opt-country").on("change", onSelectCountry);

  $("#input-search").on("input", searchProviders);

  $("#button-closeModal").on("click", closeModal);
  $("#button-help").on("click", openModal);

  // DEBUG
  $("#query").on("click", providerQuery);
}

function isMobile() {
  return window.innerWidth < 600;
}

function closeModal() {
  $("#introModal").hide();
}

function openModal() {
  $("#introModal").show();
}

function showLeftPanel() {
  $("#panel-left").removeClass("hidden");

  if (isMobile()) {
    let pos = window.innerHeight * 0.4 - 32;
    $("#button-openLeftPanel").animate({ top: pos + "px" }, 400, "swing");
    $("#panel-left").animate({ top: "40vh" }, 400, "swing");
    $("#button-closeLeftPanel").show();
  } else {
    $("#panel-left").animate({ left: "0" }, 400, "swing");
  }
}

function hideLeftPanel() {
  if (isMobile()) {
    let pos = window.innerHeight - 32;

    $("#button-openLeftPanel").animate({ top: pos + "px" }, 400, "swing");
    $("#panel-left").animate({ top: "100vh" }, 400, "swing", function () {
      $("#button-closeLeftPanel").hide();
    });
  } else {
    $("#panel-left").animate({ left: "-400px" }, 400, "swing", function () {
      $(this).addClass("hidden");
    });
  }
}

function showRightPanel() {
  $("#panel-right").removeClass("hidden");

  if (isMobile()) {
    let pos = window.innerHeight * 0.4 - 32;
    $("#panel-right").animate({ top: pos + "px" }, 400, "swing");
  } else {
    $("#panel-right").animate({ right: "0" }, 400, "swing");
  }
}

function hideRightPanel() {
  if (isMobile()) {
    $("#panel-right").animate({ top: "100vh" }, 400, "swing");
  } else {
    $("#panel-right").animate({ right: "-400px" }, 400, "swing", function () {
      $(this).addClass("hidden");
    });
  }

  for (let marker of markers) {
    marker.content.classList.remove("highlight");
  }
}

function openTabFilter() {
  showLeftPanel();
  $("#panel-left-tabList").addClass("hidden");
  $("#panel-left-tabFilter").removeClass("hidden");
  $("#panel-left-tabSearch").addClass("hidden");
}

function openTabList() {
  showLeftPanel();
  $("#panel-left-tabFilter").addClass("hidden");
  $("#panel-left-tabList").removeClass("hidden");
  $("#panel-left-tabSearch").addClass("hidden");
}

function openTabSearch() {
  showLeftPanel();
  $("#panel-left-tabFilter").addClass("hidden");
  $("#panel-left-tabList").addClass("hidden");
  $("#panel-left-tabSearch").removeClass("hidden");
}

function switchProfession(e) {
  if (e.target.value == "trainer") {
    searchTrainers = true;

    showTrainerFilters();
  } else {
    searchTrainers = false;

    showSurgeonFilters();
  }


  resetAllFilters();
}

function resetModality(e) {
  $("#btn-reset-modality").hide();
  $("#opt-modality-inPerson").prop("checked", false);
  $("#opt-modality-virtual").prop("checked", false);

  generateMarkers();
}

function onSelectModality(e) {
  $("#btn-reset-modality").show();
}

function resetNumber(e) {
  $("#btn-reset-number").hide();
  $("#opt-number-individual").prop("checked", false);
  $("#opt-number-group").prop("checked", false);

  generateMarkers();
}

function onSelectNumber(e) {
  $("#btn-reset-number").show();
}

function onSelectCountry(e) {
  const country = $("#opt-country").val();

  if (country == "US") {
    $("#opt-state").show();
    $("#opt-province").hide();
    $("#opt-province").val("any");
  } else if (country == "CA") {
    $("#opt-state").hide();
    $("#opt-state").val("any");
    $("#opt-province").show();
  } else {
    $("#opt-province").hide();
    $("#opt-state").val("any");
    $("#opt-state").hide();
    $("#opt-province").val("any");
  }
}

function showTrainerFilters() {
  $("#label-professionalArea").show();
  $("#group-professionalArea").show();

  $("#label-procedures").hide();
  $("#opt-procedure").hide();

  $("#label-language").show();
  $("#opt-language").show();

  $("#label-modality").show();
  $("#group-modality").show();

  $("#label-number").show();
  $("#group-number").show();

  $("#label-goal").show();
  $("#group-goal").show();

  $(".divider-trainer").show();
}

function showSurgeonFilters() {
  $("#label-professionalArea").hide();
  $("#group-professionalArea").hide();

  $("#label-procedures").show();
  $("#opt-procedure").show();

  $("#label-language").hide();
  $("#opt-language").hide();

  $("#label-modality").hide();
  $("#group-modality").hide();

  $("#label-number").hide();
  $("#group-number").hide();

  $("#label-goal").hide();
  $("#group-goal").hide();

  $(".divider-trainer").hide();
}

function searchProviders(e) {
  let matches = [];
  let searchStr = e.target.value.toLowerCase();

  for (let trainer of trainers) {
    let nameParts = trainer.name.split(" ");

    for (let part of nameParts) {
      if (part.toLowerCase().startsWith(searchStr)) {
        matches.push(trainer);
        break;
      }
    }
  }

  for (let surgeon of surgeons) {
    let nameParts = surgeon.name.split(" ");

    for (let part of nameParts) {
      if (part.toLowerCase().startsWith(searchStr)) {
        matches.push(surgeon);
        break;
      }
    }
  }

  matches.sort((a, b) => a["name"].localeCompare(b["name"]));

  loadSearchList(matches);
}

function resetAllFilters() {
  // Professional Area
  $("#opt-professionalArea-slp").prop('checked', false);
  $("#opt-professionalArea-vpst").prop('checked', false);
  $("#opt-professionalArea-tac").prop('checked', false);
  $("#opt-professionalArea-gavt").prop('checked', false);
  $("#opt-professionalArea-other").prop('checked', false);
  
  // Procedures offered
  $("#opt-procedure").val("any");
  
  // Location
  $("#opt-country").val("any");
  $("#opt-state").val("any");
  $("#opt-province").val("any");

  // Language
  $("#opt-language").val("any");

  // Number/Modality
  resetModality();
  resetNumber();

  // Goals
  $("#opt-goal-masculine").prop('checked', false);
  $("#opt-goal-feminine").prop('checked', false);
  $("#opt-goal-androgynous").prop('checked', false);
  $("#opt-goal-singing").prop('checked', false);

  // Provider identity
  $("#opt-pi-cisman").prop('checked', false);
  $("#opt-pi-ciswoman").prop('checked', false);
  $("#opt-pi-transman").prop('checked', false);
  $("#opt-pi-transwoman").prop('checked', false);
  $("#opt-pi-nonbinary").prop('checked', false);
  $("#opt-pi-other").prop('checked', false);

  // Regenerate the markers 
  generateMarkers();
}

function providerQuery() {
  // Profession
  const profession = $("#opt-profession").val();

  // Professional Area
  const pa_slp = $("#opt-professionalArea-slp").is(":checked");
  const pa_vpst = $("#opt-professionalArea-vpst").is(":checked");
  const pa_tac = $("#opt-professionalArea-tac").is(":checked");
  const pa_gavt = $("#opt-professionalArea-gavt").is(":checked");
  const pa_other = $("#opt-professionalArea-other").is(":checked");

  // Procedures offered
  const procedure = $("#opt-procedure").val();

  // Location
  const country = $("#opt-country").val();
  const state = $("#opt-state").val();
  const province = $("#opt-province").val();

  // Language
  const language = $("#opt-language").val();

  // Modality
  const modality = $('input[name="opt-modality"]:checked').val();

  // Number
  const number = $('input[name="opt-number"]:checked').val();

  // Goals
  const goal_masculine = $("#opt-goal-masculine").is(":checked");
  const goal_feminine = $("#opt-goal-feminine").is(":checked");
  const goal_androgynous = $("#opt-goal-androgynous").is(":checked");
  const goal_singing = $("#opt-goal-singing").is(":checked");

  // Provider Identity
  const pi_cisman = $("#opt-pi-cisman").is(":checked");
  const pi_ciswoman = $("#opt-pi-ciswoman").is(":checked");
  const pi_transman = $("#opt-pi-transman").is(":checked");
  const pi_transwoman = $("#opt-pi-transwoman").is(":checked");
  const pi_nonbinary = $("#opt-pi-nonbinary").is(":checked");
  const pi_other = $("#opt-pi-other").is(":checked");

  const q = {
    profession: profession,
    professionalArea: {
      slp: pa_slp,
      vpst: pa_vpst,
      tac: pa_tac,
      gavt: pa_gavt,
      other: pa_other,
    },
    procedure: procedure,
    country: country,
    state: state,
    province: province,
    language: language,
    modality: modality,
    number: number,
    goal: {
      masculine: goal_masculine,
      feminine: goal_feminine,
      androgynous: goal_androgynous,
      singing: goal_singing,
    },
    identity: {
      cisman: pi_cisman,
      ciswoman: pi_ciswoman,
      transman: pi_transman,
      transwoman: pi_transwoman,
      nonbinary: pi_nonbinary,
      other: pi_other,
    },
  };

  return q;
}

function providerMatchesQuery(p, q) {
  // Professional Area
  if (
    q.profession == "trainer" &&
    q.professionalArea != null &&
    (q.professionalArea.gavt || // Make sure at least one professional area is selected
      q.professionalArea.other ||
      q.professionalArea.slp ||
      q.professionalArea.tac ||
      q.professionalArea.vpst)
  ) {
    // Check each option
    let matchGavt = q.professionalArea.gavt == true && p.areas.includes("gavt");
    let matchOther =
      q.professionalArea.other == true && p.areas.includes("other");
    let matchSlp = q.professionalArea.slp == true && p.areas.includes("slp");
    let matchTac = q.professionalArea.tac == true && p.areas.includes("tac");
    let matchVpst = q.professionalArea.vpst == true && p.areas.includes("vpst");

    // If at least one of these is a match, provider passes test
    if (!(matchGavt || matchOther || matchSlp || matchTac || matchVpst)) {
      return false;
    }
  }

  // Procedures
  if (q.procedure != "any") {
    if (!p.procedures[q.procedure]) {
      return false;
    }
  }

  // Location
  if (q.country != null && q.country != "any") {
    if (q.country != p.country) {
      return false;
    }

    // State
    if (q.country == "US" && q.state != null && q.state != "any") {
      if (q.state != p.state) {
        // If they are a surgeon, ignore virtual locations
        if (!p.isTrainer) {
          return false;
        }

        // If not in person only, check virtual locations
        if (q.modality == "inPerson") {
          return false;
        }
        else if (!p.virtualLocations.includes(q.state)) {
          return false;
        }
      }
    }

    // Province
    if (
      q.country == "CA" &&
      q.province != null &&
      q.province != "any"
    ) {
      if (q.province != p.state) {
        // If they are a surgeon, ignore virtual locations
        if (!p.isTrainer) {
          return false;
        }

        // If not in person only, check virtual locations
        if (q.modality == "inPerson") {
          return false;
        }
        else if (!p.virtualLocations.includes(q.province)) {
          return false;
        }
      }
    }
  }

  // Language
  if (q.language != "any") {
    let hasLanguage = false;

    for (let providerLanguage of p.languages) {
      if (q.language == providerLanguage) {
        hasLanguage = true;
        break;
      }
    }

    if (!hasLanguage) {
      return false;
    }
  }

  // Number + Modality
  if (q.profession == "trainer" && q.number != null && q.modality == null) {
    // If only number being filtered
    if (q.number == "individual") {
      if (!(p.numMods.individual_inPerson || p.numMods.individual_virtual)) {
        return false;
      }
    } else {
      if (!(p.numMods.group_inPerson || p.numMods.group_virtual)) {
        return false;
      }
    }
  } else if (
    q.profession == "trainer" &&
    q.number == null &&
    q.modality != null
  ) {
    // If only modality being filtered
    if (q.modality == "inPerson") {
      if (!(p.numMods.individual_inPerson || p.numMods.group_inPerson)) {
        return false;
      }
    } else {
      if (!(p.numMods.individual_virtual || p.numMods.group_virtual)) {
        return false;
      }
    }
  } else if (
    q.profession == "trainer" &&
    q.number != null &&
    q.modality != null
  ) {
    // If both being filtered
    if (!p.numMods[q.number + "_" + q.modality]) {
      return false;
    }
  }

  // Goal
  if (
    q.profession == "trainer" &&
    q.goal != null &&
    (q.goal.androgynous || // Make sure at least one goal is selected
      q.goal.feminine ||
      q.goal.masculine ||
      q.goal.singing)
  ) {
    // Check each option
    if (q.goal.androgynous == true && !p.goals.includes("androgynous")) {
      return false;
    }
    if (q.goal.feminine == true && !p.goals.includes("feminine")) {
      return false;
    }
    if (q.goal.masculine == true && !p.goals.includes("masculine")) {
      return false;
    }
    if (q.goal.singing == true && !p.goals.includes("singing")) {
      return false;
    }
  }

  // Identity
  if (
    q.identity != null &&
    (q.identity.cisman || // Make sure at least one identity is selected
      q.identity.ciswoman ||
      q.identity.nonbinary ||
      q.identity.other ||
      q.identity.transman ||
      q.identity.transwoman)
  ) {
    // Check each option
    let matchCisman = q.identity.cisman == true && p.identityFilter == "cisman";
    let matchCiswoman = q.identity.ciswoman == true && p.identityFilter == "ciswoman";
    let matchNonbinary =
      q.identity.nonbinary == true && p.identityFilter == "nonbinary";
    let matchOther = q.identity.other == true && p.identityFilter == "other";
    let matchTransman = q.identity.transman == true && p.identityFilter == "transman";
    let matchTranswoman =
      q.identity.transwoman == true && p.identityFilter == "transwoman";

    // If at least one of these is a match, provider passes test
    if (
      !(
        matchCisman ||
        matchCiswoman ||
        matchNonbinary ||
        matchOther ||
        matchTransman ||
        matchTranswoman
      )
    ) {
      return false;
    }
  }

  // If no tests fail, provider is a match
  return true;
}

function loadProviderList(providers) {
  const panel = document.getElementById("panel-left-tabList");
  panel.innerHTML = "";

  const label = document.createElement("label");
  label.innerText = "List View";
  panel.appendChild(label);

  const disclaimer = document.createElement("p");
  disclaimer.className = "disclaimer";
  disclaimer.innerText = "Results are sorted alphabetically.";
  panel.appendChild(disclaimer);

  const divider = document.createElement("hr");
  panel.appendChild(divider);

  for (let provider of providers) {
    const isTrainer = provider.procedures ? false : true;

    const el = document.createElement("div");
    el.className = "provider-list-item";
    el.onclick = () => {
      centerMarker(provider.marker);

      if (searchTrainers) {
        loadTrainer(provider);
      } else {
        loadSurgeon(provider);
      }
      showRightPanel();
    };

    const name = document.createElement("p");
    name.className = "name";
    name.className += isTrainer ? " trainer" : " surgeon";
    name.innerText = provider.name;
    el.appendChild(name);

    if (isTrainer) {
      const credentials = document.createElement("p");
      credentials.className = "credentials";
      credentials.innerText = provider.credentials;
      el.appendChild(credentials);

      const nm = provider.numMods;

      // In Person
      if (nm.individual_inPerson || nm.group_inPerson) {
        let str = "In Person - ";

        str += nm.individual_inPerson ? "Individual" : "";
        str += nm.individual_inPerson && nm.group_inPerson ? "/" : "";
        str += nm.group_inPerson ? "Group" : "";

        if (provider.country != null && provider.country != "") {
          str +=
            " (" +
            provider.city +
            " " +
            provider.state +
            ", " +
            provider.country +
            ")";
        }

        const inPerson = document.createElement("p");
        inPerson.innerText = str;
        el.appendChild(inPerson);
      }

      // Virtual
      if (nm.individual_virtual || nm.group_virtual) {
        let str = "Virtual - ";

        str += nm.individual_virtual ? "Individual" : "";
        str += nm.individual_virtual && nm.group_virtual ? "/" : "";
        str += nm.group_virtual ? "Group" : "";

        if (
          provider.virtualLocations != null &&
          provider.virtualLocations.length > 0
        ) {
          str += " (";

          for (let i = 0; i < provider.virtualLocations.length; i++) {
            str += provider.virtualLocations[i];
            if (i < provider.virtualLocations.length - 1) {
              str += ", ";
            }
          }

          str += ")";
        }

        const virtual = document.createElement("p");
        virtual.innerText = str;
        el.appendChild(virtual);
      }
    }

    if (!isTrainer) {
      const procedures = document.createElement("p");
      let str = "";

      for (let procedure of Object.keys(provider.procedures)) {
        if (provider.procedures[procedure]) {
          str +=
            str == ""
              ? PROCEDURE_NAMES[procedure]
              : ", " + PROCEDURE_NAMES[procedure];
        }
      }

      procedures.innerText = str;

      el.appendChild(procedures);
    }

    panel.appendChild(el);
  }
}

function loadSearchList(providers) {
  const panel = document.getElementById("search-results");
  panel.innerHTML = "";

  for (let provider of providers) {
    const isTrainer = provider.procedures ? false : true;

    const el = document.createElement("div");
    el.className = "provider-list-item";
    el.onclick = () => {
      if (isTrainer) {
        searchTrainers = true;
        $("#opt-profession").val("trainer");
        showTrainerFilters();
        generateMarkers();
        loadTrainer(provider);
      } else {
        searchTrainers = false;
        $("#opt-profession").val("surgeon");
        showSurgeonFilters();
        generateMarkers();
        loadSurgeon(provider);
      }
      showRightPanel();
      centerMarker(provider.marker);
    };

    const nameContainer = document.createElement("div");
    nameContainer.className = "name-container";
    el.appendChild(nameContainer);

    const name = document.createElement("p");
    name.className = "name";
    name.className += isTrainer ? " trainer" : " surgeon";
    name.innerText = provider.name;
    nameContainer.appendChild(name);

    const role = document.createElement("p");
    role.innerText = isTrainer ? "Trainer" : "Surgeon";
    //nameContainer.appendChild(role);

    if (isTrainer) {
      const credentials = document.createElement("p");
      credentials.className = "credentials";
      credentials.innerText = provider.credentials;
      el.appendChild(credentials);

      const nm = provider.numMods;

      // In Person
      if (nm.individual_inPerson || nm.group_inPerson) {
        let str = "In Person - ";

        str += nm.individual_inPerson ? "Individual" : "";
        str += nm.individual_inPerson && nm.group_inPerson ? "/" : "";
        str += nm.group_inPerson ? "Group" : "";

        if (provider.country != null && provider.country != "") {
          str +=
            " (" +
            provider.city +
            " " +
            provider.state +
            ", " +
            provider.country +
            ")";
        }

        const inPerson = document.createElement("p");
        inPerson.innerText = str;
        el.appendChild(inPerson);
      }

      // Virtual
      if (nm.individual_virtual || nm.group_virtual) {
        let str = "Virtual - ";

        str += nm.individual_virtual ? "Individual" : "";
        str += nm.individual_virtual && nm.group_virtual ? "/" : "";
        str += nm.group_virtual ? "Group" : "";

        if (
          provider.virtualLocations != null &&
          provider.virtualLocations.length > 0
        ) {
          str += " (";

          for (let i = 0; i < provider.virtualLocations.length; i++) {
            str += provider.virtualLocations[i];
            if (i < provider.virtualLocations.length - 1) {
              str += ", ";
            }
          }

          str += ")";
        }

        const virtual = document.createElement("p");
        virtual.innerText = str;
        el.appendChild(virtual);
      }
    }

    if (!isTrainer) {
      const procedures = document.createElement("p");
      let str = "";

      for (let procedure of Object.keys(provider.procedures)) {
        if (provider.procedures[procedure]) {
          str +=
            str == ""
              ? PROCEDURE_NAMES[procedure]
              : ", " + PROCEDURE_NAMES[procedure];
        }
      }

      procedures.innerText = str;

      el.appendChild(procedures);
    }

    panel.appendChild(el);
  }
}

function loadTrainer(trainer) {
  ///////////////////////////////////////////////////////
  //                      Header                       //
  ///////////////////////////////////////////////////////

  $("#data-name").text(trainer.name);
  $("#data-credentials").text(trainer.credentials);
  $("#data-intro").text(trainer.intro);
  $("#container-procedures").hide();

  ///////////////////////////////////////////////////////
  //                     Quick Info                    //
  ///////////////////////////////////////////////////////

  // Website
  if (trainer.website != null && trainer.website != "") {
    $("#container-website").show();
    $("#data-website").attr("href", trainer.website);
  } else {
    $("#container-website").hide();
  }

  const nm = trainer.numMods;

  // In Person
  if (nm.individual_inPerson || nm.group_inPerson) {
    let str = "In Person - ";

    str += nm.individual_inPerson ? "Individual" : "";
    str += nm.individual_inPerson && nm.group_inPerson ? "/" : "";
    str += nm.group_inPerson ? "Group" : "";

    if (trainer.country != null && trainer.country != "") {
      str +=
        " (" +
        trainer.city +
        " " +
        trainer.state +
        ", " +
        trainer.country +
        ")";
    }

    $("#data-inPerson").text(str);
    $("#container-inPerson").show();
  } else {
    $("#container-inPerson").hide();
  }

  // Virtual
  if (nm.individual_virtual || nm.group_virtual) {
    let str = "Virtual - ";

    str += nm.individual_virtual ? "Individual" : "";
    str += nm.individual_virtual && nm.group_virtual ? "/" : "";
    str += nm.group_virtual ? "Group" : "";

    if (
      trainer.virtualLocations != null &&
      trainer.virtualLocations.length > 0
    ) {
      str += " (";

      for (let i = 0; i < trainer.virtualLocations.length; i++) {
        str += trainer.virtualLocations[i];
        if (i < trainer.virtualLocations.length - 1) {
          str += ", ";
        }
      }

      str += ")";
    }

    $("#data-virtual").text(str);
    $("#container-virtual").show();
  } else {
    $("#container-virtual").hide();
  }

  // Phone
  if (trainer.phone != null && trainer.phone != "") {
    $("#container-phone").show();
    $("#data-phone").attr("href", "tel:" + trainer.phone);
    $("#data-phone").text(trainer.phone);
  } else {
    $("#container-phone").hide();
  }

  // Since
  if (trainer.generalSince != null) {
    $("#data-since").text(trainer.generalSince);
    $("#container-servicesSinceGeneral").show();
  }
  else {
    $("#container-servicesSinceGeneral").hide();
  }

  if (trainer.gavcSince != null) {
    $("#data-sinceGA").text(trainer.gavcSince);
    $("#container-servicesSinceGA").show();
  }
  else {
    $("#container-servicesSinceGA").hide();
  }

  if (trainer.generalSince != null && trainer.gavcSince != null) {
    $("#container-servicesSince").show();
  }
  else {
    $("#container-servicesSince").hide();
  }

  // Languages
  if (trainer.languages.length > 0) {
    let str = "";

    for (let lang of trainer.languages) {
      if (str == "") {
        str += lang;
      } else {
        str += ", " + lang;
      }
    }

    $("#data-languages").text(str);
    $("#container-languages").show();
  }
  else {
    $("#container-languages").hide();
  }

  // Goals
  if (trainer.goals.length > 0) {
    let str = "";

    for (let goal of trainer.goals) {
      if (str == "") {
        str += goal;
      } else {
        str += ", " + goal;
      }
    }

    $("#data-goals").text(str);
    $("#container-goals").show();
  }
  else {
    $("#container-goals").hide();
  }

  ///////////////////////////////////////////////////////
  //               Trainer Provided Info               //
  ///////////////////////////////////////////////////////

  // Affiliations
  if (trainer.affiliations != null && trainer.affiliations.length > 0) {
    $("#data-provider-affiliations").html(null);

    for (let aff of trainer.affiliations) {
      $("#data-provider-affiliations").append("<li>" + aff + "</li>");
    }

    $("#section-provider-affiliations").show();
  } else {
    $("#section-provider-affiliations").hide();
  }

  // Additional Identities
  if ((trainer.identityDisplay != null && trainer.identityDisplay != "Prefer Not to Say") || (trainer.additionalIdentity != null && trainer.additionalIdentity != "")) {
    $("#data-provider-identity").text(trainer.identityDisplay);
    $("#data-provider-identities").text(trainer.additionalIdentity);

    $("#section-provider-identities").show();
  } else {
    $("#section-provider-identities").hide();
  }

  // Financial
  if (trainer.financial != null && trainer.financial != "") {
    $("#data-provider-finance").text(trainer.financial);

    $("#section-provider-finance").show();
  } else {
    $("#section-provider-finance").hide();
  }

  // Training
  if (trainer.training != null && trainer.training != "") {
    $("#data-provider-training").text(trainer.training);

    $("#section-provider-training").show();
  } else {
    $("#section-provider-training").hide();
  }

  // Cultural
  if (trainer.cultural != null && trainer.cultural != "") {
    $("#data-provider-culture").text(trainer.cultural);

    $("#section-provider-culture").show();
  } else {
    $("#section-provider-culture").hide();
  }

  // Additional
  if (
    trainer.additionalInformation != null &&
    trainer.additionalInformation != ""
  ) {
    $("#data-provider-additional").text(trainer.additionalInformation);

    $("#section-provider-additional").show();
  } else {
    $("#section-provider-additional").hide();
  }

  for (let marker of markers) {
    marker.content.classList.remove("highlight");
  }

  trainer.marker.content.classList.add("highlight");
}

function loadSurgeon(surgeon) {
  ///////////////////////////////////////////////////////
  //                      Header                       //
  ///////////////////////////////////////////////////////

  $("#data-name").text(surgeon.name);
  $("#data-credentials").text(surgeon.credentials);
  $("#data-intro").text(surgeon.intro);

  $("#data-procedures").empty();
  for (let procedure of Object.keys(surgeon.procedures)) {
    if (surgeon.procedures[procedure]) {
      const el = document.createElement("li");
      el.innerText = PROCEDURE_NAMES[procedure];
      $("#data-procedures").append(el);
    }
  }
  $("#container-procedures").show();

  ///////////////////////////////////////////////////////
  //                     Quick Info                    //
  ///////////////////////////////////////////////////////

  // Website
  if (surgeon.website != null && surgeon.website != "") {
    $("#container-website").show();
    $("#data-website").attr("href", surgeon.website);
  } else {
    $("#container-website").hide();
  }

  $("#container-inPerson").hide();
  $("#container-virtual").hide();
  $("#container-languages").hide();
  $("#container-goals").hide();

  // Phone
  if (surgeon.phone != null && surgeon.phone != "") {
    $("#container-phone").show();
    $("#data-phone").attr("href", "tel:" + surgeon.phone);
    $("#data-phone").text(surgeon.phone);
  } else {
    $("#container-phone").hide();
  }

  // Since
  if (surgeon.generalSince != null) {
    $("#data-since").text(surgeon.generalSince);
    $("#container-servicesSinceGeneral").show();
  }
  else {
    $("#container-servicesSinceGeneral").hide();
  }

  if (surgeon.gavcSince != null) {
    $("#data-sinceGA").text(surgeon.gavcSince);
    $("#container-servicesSinceGA").show();
  }
  else {
    $("#container-servicesSinceGA").hide();
  }

  if (surgeon.generalSince != null && surgeon.gavcSince != null) {
    $("#container-servicesSince").show();
  }
  else {
    $("#container-servicesSince").hide();
  }

  ///////////////////////////////////////////////////////
  //               Trainer Provided Info               //
  ///////////////////////////////////////////////////////

  // Affiliations
  if (surgeon.affiliations != null && surgeon.affiliations.length > 0) {
    $("#data-provider-affiliations").html(null);

    for (let aff of surgeon.affiliations) {
      $("#data-provider-affiliations").append("<li>" + aff + "</li>");
    }

    $("#section-provider-affiliations").show();
  } else {
    $("#section-provider-affiliations").hide();
  }

  // Additional Identities
  if (surgeon.additionalIdentity != null && surgeon.additionalIdentity != "") {
    $("#data-provider-identities").text(surgeon.additionalIdentity);

    $("#section-provider-identities").show();
  } else {
    $("#section-provider-identities").hide();
  }

  // Financial
  if (surgeon.financial != null && surgeon.financial != "") {
    $("#data-provider-finance").text(surgeon.financial);

    $("#section-provider-finance").show();
  } else {
    $("#section-provider-finance").hide();
  }

  // Training
  if (surgeon.training != null && surgeon.training != "") {
    $("#data-provider-training").text(surgeon.training);

    $("#section-provider-training").show();
  } else {
    $("#section-provider-training").hide();
  }

  // Cultural
  if (surgeon.cultural != null && surgeon.cultural != "") {
    $("#data-provider-culture").text(surgeon.cultural);

    $("#section-provider-culture").show();
  } else {
    $("#section-provider-culture").hide();
  }

  // Additional
  if (
    surgeon.additionalInformation != null &&
    surgeon.additionalInformation != ""
  ) {
    $("#data-provider-additional").text(surgeon.additionalInformation);

    $("#section-provider-additional").show();
  } else {
    $("#section-provider-additional").hide();
  }
}

function centerMarker(marker) {
  map.setZoom(10);
  if (isMobile()) {
    map.setCenter(marker.position);
    let offsetY = window.innerHeight * 0.3;
    map.panBy(0, offsetY);
  } else {
    map.setCenter(marker.position);
  }

  const newPin = new PinElement({
    background: "#FFFFFF",
    borderColor: "#000000",
    glyphColor: "#F0F0F0",
  });

  for (let marker of markers) {
    marker.content.classList.remove("highlight");
  }

  marker.content.classList.add("highlight");
}

function loadCountries(countries) {
  fetch("./countries.json")
    .then((response) => response.json())
    .then((json) => {
      const optgroup = document.getElementById("opt-country");

      for (let c of countries) {
        if (c in json) {
          const el = document.createElement("option");
          el.value = c;
          el.innerText = json[c];

          optgroup.appendChild(el);
        }
      }
    });
}

function loadStates() {
  fetch("./us_states.json")
    .then((response) => response.json())
    .then((json) => {
      const optgroup = document.getElementById("opt-state");
      for (let s in json) {
        const el = document.createElement("option");
        el.value = s;
        el.innerText = json[s];

        optgroup.appendChild(el);
      }
    });
}

function loadProvinces() {
  fetch("./ca_provinces.json")
    .then((response) => response.json())
    .then((json) => {
      const optgroup = document.getElementById("opt-province");
      for (let p in json) {
        const el = document.createElement("option");
        el.value = p;
        el.innerText = json[p];

        optgroup.appendChild(el);
      }
    });
}

function loadLanguages(languages) {
  const optgroup = document.getElementById("opt-language");

  for (let l of languages) {
    const el = document.createElement("option");
    el.value = l.value;
    el.style = "text-transform: capitalize;";
    el.innerText = l.display;

    optgroup.appendChild(el);
  }
}

attachEvents();
hideRightPanel();
$("#btn-reset-modality").hide();
$("#btn-reset-number").hide();
$("#opt-state").hide();
$("#opt-province").hide();
