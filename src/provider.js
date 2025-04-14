import QUERY from "./query.js";
import UI from "./ui.js";
import MAP from "./map.js";

const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
  "marker"
);

let markers = [];

const PROCEDURE_NAMES = {
  chond: "Chondrolaryngoplasty",
  wg: "Wendler's Glottoplasty",
  lava: "LAVA",
  criapp: "Cricothyroid Approximation",
  t3t: "Type 3 Thyroplasty",
  other: "Other",
};

function getMarkers() {
  return markers;
}

function generateProviders(map, trainers, surgeons, languages) {
  const mode = UI.getProviderTypeToSearch();

  // Remove all existing markers
  markers.forEach((marker) => {
    marker.setMap(null);
  });

  markers = [];

  // Get valid providers
  const query = QUERY.providerQuery();
  let validProviders = [];

  if (mode == UI.MODE_ANY || mode == UI.MODE_TRAINERS) {
    for (let t of trainers) {
      if (QUERY.providerMatchesQuery(t, query)) {
        validProviders.push(t);
      }
    }
  }

  if (mode == UI.MODE_ANY || mode == UI.MODE_SURGEONS) {
    for (let s of surgeons) {
      if (QUERY.providerMatchesQuery(s, query)) {
        validProviders.push(s);
      }
    }
  }

  validProviders.sort((a, b) => a["nameSort"].localeCompare(b["nameSort"]));

  // Generate the markers
  for (let p of validProviders) {
    const isTrainer = p.isTrainer;

    const color = isTrainer ? "#cc87bf" : "#2872b8";
    const color2 = isTrainer ? "#a35394" : "#0f4c85";

    const pin = new PinElement({
      background: color,
      borderColor: color2,
      glyphColor: color2,
    });

    const marker = new AdvancedMarkerElement({
      map: map,
      position: p.pin,
      title: p.name,
      content: pin.element,
    });

    marker.addListener("click", (e) => {
      loadProvider(p, languages);
      marker.content.classList.add("highlight");
      MAP.moveTo(map, marker.position);
    });

    p.marker = marker;
    markers.push(marker);
  }

  // Generate the list view
  loadProviderList(map, trainers, surgeons, languages, validProviders);
}

function searchProviders(map, trainers, surgeons, languages) {
  let matches = [];
  let searchStr = $("#input-search").val();

  for (let trainer of trainers) {
    if (providerNameMatchesSearch(trainer, searchStr)) {
      matches.push(trainer);
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

  loadSearchList(map, trainers, surgeons, languages, matches);
}

function providerNameMatchesSearch(p, rawSearch) {
  let search = rawSearch.replace(/[^a-zA-Z\s]/g, "").toLowerCase();
  let providerName = p.name.replace(/[^a-zA-Z\s]/g, "").toLowerCase();

  // First check full name match
  if (providerName.startsWith(search)) {
    return true;
  }

  // If only one word in search, check each part
  let nameParts = providerName.split(" ");

  if (search.split(" ").length == 1) {
    for (let part of nameParts) {
      if (part.startsWith(search)) {
        return true;
      }
    }
  } else {
    // If multiple words in search, see if provider name matches all parts
    let matchesAll = true;

    for (let sPart of search.split(" ")) {
      let matches_sPart = false;
      for (let pPart of nameParts) {
        if (pPart.startsWith(sPart)) {
          matches_sPart = true;
        }
      }

      if (!matches_sPart) {
        matchesAll = false;
      }
    }

    return matchesAll;
  }
}

function buildProviderListItem(map, trainers, surgeons, languages, provider) {
  const isTrainer = provider.procedures ? false : true;

  const el = document.createElement("div");
  el.className = "provider-list-item";
  el.onclick = () => {
    if ((UI.getProviderTypeToSearch() == UI.MODE_TRAINERS && !provider.isTrainer) || (UI.getProviderTypeToSearch() == UI.MODE_SURGEONS && provider.isTrainer)) {
      $("#opt-providerType").val(UI.MODE_ANY);
      $("#opt-providerType").removeClass("mode-trainers");
      $("#opt-providerType").removeClass("mode-surgeons");
      generateProviders(map, trainers, surgeons, languages)
    }
    loadProvider(provider, languages);
    provider.marker.content.classList.add("highlight");
    MAP.moveTo(map, provider.marker.position);
  };

  const nameContainer = document.createElement("span");
  nameContainer.className = "name-container";

  const name = document.createElement("span");
  name.className = "name";
  name.className += isTrainer ? " trainer" : " surgeon";
  if (provider.credentials != null && provider.credentials != "") {
    name.innerText = provider.name + ",";
  } else {
    name.innerText = provider.name;
  }
  nameContainer.appendChild(name);

  const credentials = document.createElement("span");
  credentials.className = "credentials";
  credentials.innerText = provider.credentials;
  nameContainer.appendChild(credentials);

  el.appendChild(nameContainer);

  if (isTrainer) {
    const nm = provider.numMods;

    // In Person
    if (nm.individual_inPerson || nm.group_inPerson) {
      let cityText = provider.city != null ? provider.city : "";
      let stateText = provider.city != null ? provider.state : "";
      let countryText = provider.city != null ? provider.country : "";
    
      let str = cityText + " " + stateText + ", " + countryText;

      const inPerson = document.createElement("p");
      inPerson.className = "inPerson-container";

      const inPersonIcon = document.createElement("span");
      inPersonIcon.className = "material-symbols-outlined";
      inPersonIcon.innerText = "location_on";
      inPerson.appendChild(inPersonIcon);

      const inPersonText = document.createElement("span");
      inPersonText.innerText = str;
      inPerson.appendChild(inPersonText);

      el.appendChild(inPerson);
    }

    // Virtual
    if (nm.individual_virtual || nm.group_virtual) {
      if (
        provider.virtualLocations != null &&
        provider.virtualLocations.length > 0
      ) {
        let str = "";

        for (let i = 0; i < provider.virtualLocations.length; i++) {
          str += provider.virtualLocations[i];
          if (i < provider.virtualLocations.length - 1) {
            str += ", ";
          }
        }

        const virtual = document.createElement("p");
        virtual.className = "virtual-container";

        const virtualIcon = document.createElement("span");
        virtualIcon.className = "material-symbols-outlined";
        virtualIcon.innerText = "devices";
        virtual.appendChild(virtualIcon);

        const virtualText = document.createElement("span");
        virtualText.innerText = str;
        virtual.appendChild(virtualText);

        el.appendChild(virtual);
      }
    }
  } else {
    let cityText = provider.city != null ? provider.city : "";
    let stateText = provider.city != null ? provider.state : "";
    let countryText = provider.city != null ? provider.country : "";
    
    let str = cityText + " " + stateText + ", " + countryText;

    const inPerson = document.createElement("p");
    inPerson.className = "inPerson-container";

    const inPersonIcon = document.createElement("span");
    inPersonIcon.className = "material-symbols-outlined blue";
    inPersonIcon.innerText = "location_on";
    inPerson.appendChild(inPersonIcon);

    const inPersonText = document.createElement("span");
    inPersonText.innerText = str;
    inPerson.appendChild(inPersonText);

    el.appendChild(inPerson);
  }

  return el;
}

function loadProviderList(map, trainers, surgeons, languages, matches) {
  const panel = document.getElementById("panel-left-tabList-items");
  panel.innerHTML = "";

  for (let provider of matches) {
    panel.appendChild(buildProviderListItem(map, trainers, surgeons, languages, provider));
  }
}

function loadSearchList(map, trainers, surgeons, languages, matches) {
  const panel = document.getElementById("search-results");
  panel.innerHTML = "";

  for (let provider of matches) {
    panel.appendChild(buildProviderListItem(map, trainers, surgeons, languages, provider));
  }
}

function loadProvider(provider, languages) {
  const isTrainer = provider.isTrainer;

  // Update colors of panel
  if (isTrainer) {
    $("#panel-right").addClass("trainer");
    $("#panel-right").removeClass("surgeon");
  } else {
    $("#panel-right").removeClass("trainer");
    $("#panel-right").addClass("surgeon");
  }

  ///////////////////////////////////////////////////////
  //                      Header                       //
  ///////////////////////////////////////////////////////

  $("#data-name").text(provider.name);
  if (provider.credentials != null && provider.credentials != "") {
    $("#data-credentials").text(provider.credentials);
    $("#data-credentials").removeAttr("hidden");
    $("#tooltip-credentials").removeAttr("hidden");
  } else {
    $("#data-credentials").attr("hidden", true);
    $("#tooltip-credentials").attr("hidden", true);
  }

  $("#data-lastUpdated").text(provider.lastUpdated);

  ///////////////////////////////////////////////////////
  //                     Quick Info                    //
  ///////////////////////////////////////////////////////

  // Phone
  if (provider.phone != null && provider.phone != "") {
    let phoneText = provider.phone.toString();

    if (phoneText.length == 10) {
      phoneText = `(${phoneText.slice(0, 3)})-${phoneText.slice(
        3,
        6
      )}-${phoneText.slice(6)}`;
    } else if (phoneText.length == 11) {
      phoneText = `+${phoneText[0]} (${phoneText.slice(
        1,
        4
      )})-${phoneText.slice(4, 7)}-${phoneText.slice(7)}`;
    }

    $("#data-phone").attr("href", "tel:" + provider.phone);
    $("#data-phone").text(phoneText);
    $("#data-phone").show();
  } else {
    $("#data-phone").hide();
  }

  // Email
  if (provider.email != null && provider.email != "") {
    $("#data-email").attr("href", "mailto:" + provider.email);
    $("#data-email").text(provider.email);

    $("#data-email").show();
  } else {
    $("#data-email").hide();
  }

  // Website
  if (provider.website != null && provider.website != "") {
    $("#data-website").attr("href", provider.website);
    $("#data-website").show();
  } else {
    $("#data-website").hide();
  }

  const nm = provider.numMods;

  // In Person
  if (nm != null && (nm.individual_inPerson || nm.group_inPerson)) {
    let str = "";

    str += nm.individual_inPerson ? "Individual" : "";
    str += nm.individual_inPerson && nm.group_inPerson ? "/" : "";
    str += nm.group_inPerson ? "Group" : "";

    if (provider.country != null && provider.country != "") {
      str +=
        " - " +
        provider.city +
        " " +
        provider.state +
        ", " +
        provider.country +
        "";
    }

    $("#data-inPerson").text(str);
    $("#qii-inPerson").show();
  } else {
    $("#qii-inPerson").hide();
  }

  // Virtual
  if (nm != null && (nm.individual_virtual || nm.group_virtual)) {
    let str = "";

    str += nm.individual_virtual ? "Individual" : "";
    str += nm.individual_virtual && nm.group_virtual ? "/" : "";
    str += nm.group_virtual ? "Group" : "";

    if (
      provider.virtualLocations != null &&
      provider.virtualLocations.length > 0
    ) {
      str += " - ";

      for (let i = 0; i < provider.virtualLocations.length; i++) {
        str += provider.virtualLocations[i];
        if (i < provider.virtualLocations.length - 1) {
          str += ", ";
        }
      }

      //str += ")";
    }

    $("#data-virtual").text(str);
    $("#qii-virtual").show();
  } else {
    $("#qii-virtual").hide();
  }

  // Since
  if (provider.generalSince != null) {
    $("#data-since").text(provider.generalSince);
    $("#qii-servicesSince-general").show();
  } else {
    $("#qii-servicesSince-general").hide();
  }

  if (provider.gavcSince != null) {
    $("#data-sinceGA").text(provider.gavcSince);
    $("#qii-servicesSince-ga").show();
  } else {
    $("#qii-servicesSince-ga").hide();
  }

  if (provider.generalSince != null || provider.gavcSince != null) {
    $("#qii-servicesSince").show();
  } else {
    $("#qii-servicesSince").hide();
  }

  // Languages
  if (provider.languages != null && provider.languages.length > 0) {
    let str = "";

    for (let lang of provider.languages) {
      let langDisplay = languages.find((l) => l.value == lang);

      if (langDisplay) {
        langDisplay = langDisplay.display;

        if (str == "") {
          str += langDisplay;
        } else {
          str += ", " + langDisplay;
        }
      }
    }

    $("#data-languages").text(str);
    $("#qii-languages").show();
  } else {
    $("#qii-languages").hide();
  }

  // Goals
  if (provider.goals != null && provider.goals.length > 0) {
    let str = "";

    for (let goal of provider.goals) {
      if (str == "") {
        str += goal;
      } else {
        str += ", " + goal;
      }
    }

    $("#data-goals").text(str);
    $("#qii-goals").show();
  } else {
    $("#qii-goals").hide();
  }

  if (isTrainer) {
    $("#qii-procedures").hide();
  } else {
    $("#data-procedures").empty();
    for (let procedure of provider.procedureList) {
      const el = document.createElement("li");
      el.innerText = procedure;
      $("#data-procedures").append(el);
    }
    $("#qii-procedures").show();
  }

  ///////////////////////////////////////////////////////
  //               Trainer Provided Info               //
  ///////////////////////////////////////////////////////

  $("#data-intro").text(provider.intro);

  // Affiliations
  if (provider.affiliations != null && provider.affiliations.length > 0) {
    $("#data-provider-affiliations").html(null);

    for (let aff of provider.affiliations) {
      $("#data-provider-affiliations").append("<li>" + aff + "</li>");
    }

    $("#section-provider-affiliations").show();
  } else {
    $("#section-provider-affiliations").hide();
  }

  // Additional Identities
  if (
    (provider.identityDisplay != null &&
      provider.identityDisplay != "Prefer Not to Say") ||
    (provider.additionalIdentity != null && provider.additionalIdentity != "")
  ) {
    $("#data-provider-identity").text(provider.identityDisplay);

    if (
      provider.additionalIdentity != null &&
      provider.additionalIdentity != ""
    ) {
      $("#section-provider-identities-additional").removeAttr("hidden");
      $("#data-provider-identities").text(provider.additionalIdentity);
    } else {
      $("#section-provider-identities-additional").attr("hidden", "true");
    }

    $("#section-provider-identities").show();
  } else {
    $("#section-provider-identities").hide();
  }

  // Financial
  if (provider.financial != null && provider.financial != "") {
    $("#data-provider-finance").text(provider.financial);

    $("#section-provider-finance").show();
  } else {
    $("#section-provider-finance").hide();
  }

  // Training
  if (provider.training != null && provider.training != "") {
    $("#data-provider-training").text(provider.training);

    $("#section-provider-training").show();
  } else {
    $("#section-provider-training").hide();
  }

  // Speciality
  if (provider.speciality != null && provider.speciality != "") {
    $("#data-provider-speciality").text(provider.speciality);

    $("#section-provider-speciality").show();
  } else {
    $("#section-provider-speciality").hide();
  }

  // Cultural
  if (provider.cultural != null && provider.cultural != "") {
    $("#data-provider-culture").text(provider.cultural);

    $("#section-provider-culture").show();
  } else {
    $("#section-provider-culture").hide();
  }

  // Additional
  if (
    provider.additionalInformation != null &&
    provider.additionalInformation != ""
  ) {
    $("#data-provider-additional").text(provider.additionalInformation);

    $("#section-provider-additional").show();
  } else {
    $("#section-provider-additional").hide();
  }

  for (let marker of markers) {
    marker.content.classList.remove("highlight");
  }

  UI.showRightPanel(true);
}

const PROVIDER = {
  searchProviders: searchProviders,
  generateProviders: generateProviders,
  getMarkers: getMarkers,
};

export default PROVIDER;
