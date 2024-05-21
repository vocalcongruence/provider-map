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

function buildQuery() {
  const isTrainer = $("#opt-trainer").val() == "true";
  const area = $("#opt-area").val();
  const number = $("#opt-number").val();
  const modality = $("#opt-modality").val();

  const country = $("#opt-country").val();

  let state;
  if (country == "US") {
    state = $("#opt-state").val();
  } else if (country == "CA") {
    state = $("#opt-province").val();
  } else {
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

  const providerPool = searchTrainers ? trainers : surgeons;
  const color = searchTrainers ? "#cc87bf" : "#2872b8";
  const color2 = searchTrainers ? "#a35394" : "#0f4c85";

  for (let provider of providerPool) {
    if (true || providerMatchesQuery(provider, query)) {
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
        map.setZoom(8);
        map.setCenter(marker.position);

        if (searchTrainers) {
          loadTrainer(provider);
          showRightPanel();
        }
      });

      provider.marker = marker;
      validProviders.push(provider);
      markers.push(marker);
    }
  }

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

      initMap().then(() => {
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
  $("#button-openLeftPanel").on("click", showLeftPanel);
  $("#button-closeLeftPanel").on("click", hideLeftPanel);
  $("#button-closeRightPanel").on("click", hideRightPanel);
  $("#button-tabFilter").on("click", openTabFilter);
  $("#button-tabList").on("click", openTabList);

  $("#query").on("click", providerQuery);
}

function showLeftPanel() {
  $("#panel-left").removeClass("hidden");
  $("#panel-left").animate({ left: "0" }, 400, "swing");
}

function hideLeftPanel() {
  $("#panel-left").animate({ left: "-400px" }, 400, "swing", function () {
    $(this).addClass("hidden");
  });
}

function showRightPanel() {
  $("#panel-right").removeClass("hidden");
  $("#panel-right").animate({ right: "0" }, 400, "swing");
}

function hideRightPanel() {
  $("#panel-right").animate({ right: "-400px" }, 400, "swing", function () {
    $(this).addClass("hidden");
  });
}

function openTabFilter() {
  showLeftPanel();
  $("#panel-left-tabList").addClass("hidden");
  $("#panel-left-tabFilter").removeClass("hidden");
}

function openTabList() {
  showLeftPanel();
  $("#panel-left-tabFilter").addClass("hidden");
  $("#panel-left-tabList").removeClass("hidden");
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

  // Location
  const country = $("#opt-country").val();

  // State
  const state = $("#opt-state").val();

  // Language
  const lang_english = $("#opt-language-english").is(":checked");
  const lang_spanish = $("#opt-language-spanish").is(":checked");
  const lang_french = $("#opt-language-french").is(":checked");
  const lang_mandarin = $("#opt-language-mandarin").is(":checked");

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
    country: country,
    state: state,
    language: {
      english: lang_english,
      spanish: lang_spanish,
      french: lang_french,
      mandarin: lang_mandarin,
    },
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
  console.log(q);
  return q;
}

function loadProviderList(providers) {
  const panel = document.getElementById("panel-left-tabList");
  panel.innerHTML = "";

  for (let provider of providers) {
    const el = document.createElement("div");
    el.className = "provider-list-item";

    const name = document.createElement("p");
    name.className = "name";
    name.innerText = provider.name;
    el.appendChild(name);

    const general = document.createElement("p");
    general.innerText = "General Services since " + provider.generalSince;
    el.appendChild(general);

    const gavc = document.createElement("p");
    gavc.innerText = "GAVC since " + provider.gavcSince;
    el.appendChild(gavc);

    panel.appendChild(el);
  }
}

function loadTrainer(trainer) {
  console.log(trainer);

  ///////////////////////////////////////////////////////
  //                      Header                       //
  ///////////////////////////////////////////////////////

  $("#data-name").text(trainer.name);
  // TODO: update credentials
  $("#data-intro").text(trainer.intro);

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
        "(" + trainer.city + " " + trainer.state + ", " + trainer.country + ")";
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
    console.log("HERE", str);

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
  }

  if (trainer.gavcSince != null) {
    $("#data-sinceGA").text(trainer.gavcSince);
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
  }
  else {
    $("#section-provider-affiliations").hide();
  }

  // Additional Identities
  if (trainer.additionalIdentity != null && trainer.additionalIdentity != "") {
    $("#data-provider-identities").text(trainer.additionalIdentity);

    $("#section-provider-identities").show();
  }
  else {
    $("#section-provider-identities").hide();
  }

  // Financial
  if (trainer.financial != null && trainer.financial != "") {
    $("#data-provider-finance").text(trainer.financial);

    $("#section-provider-finance").show();
  }
  else {
    $("#section-provider-finance").hide();
  }

  // Training
  if (trainer.training != null && trainer.training != "") {
    $("#data-provider-training").text(trainer.training);

    $("#section-provider-training").show();
  }
  else {
    $("#section-provider-training").hide();
  }

  // Cultural
  if (trainer.cultural != null && trainer.cultural != "") {
    $("#data-provider-culture").text(trainer.cultural);

    $("#section-provider-culture").show();
  }
  else {
    $("#section-provider-culture").hide();
  }

  // Additional
  if (trainer.additionalInformation != null && trainer.additionalInformation != "") {
    $("#data-provider-additional").text(trainer.additionalInformation);

    $("#section-provider-additional").show();
  }
  else {
    $("#section-provider-additional").hide();
  }
}

attachEvents();
