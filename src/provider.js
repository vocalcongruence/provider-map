import QUERY from "./query.js";
import UI from "./ui.js";

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

export function generateProviders(map, trainers, surgeons) {
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
      loadProvider(p);
      marker.content.classList.add("highlight");
    });

    markers.push(marker);
  }

  // Generate the list view
  loadProviderList(validProviders);
}

export function searchProviders(map, trainers, surgeons) {
  let matches = [];
  let searchStr = $("#input-search").val().toLowerCase();

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

function loadProvider(provider) {
  const isTrainer = provider.isTrainer;

  ///////////////////////////////////////////////////////
  //                      Header                       //
  ///////////////////////////////////////////////////////

  $("#data-name").text(provider.name);
  $("#data-credentials").text(provider.credentials);

  ///////////////////////////////////////////////////////
  //                     Quick Info                    //
  ///////////////////////////////////////////////////////

  // Website
  if (provider.website != null && provider.website != "") {
    $("#container-website").show();
    $("#data-website").attr("href", provider.website);
  } else {
    $("#container-website").hide();
  }

  const nm = provider.numMods;

  // In Person
  if (nm != null && (nm.individual_inPerson || nm.group_inPerson)) {
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

    $("#data-inPerson").text(str);
    $("#container-inPerson").show();
  } else {
    $("#container-inPerson").hide();
  }

  // Virtual
  if (nm != null && (nm.individual_virtual || nm.group_virtual)) {
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

    $("#data-virtual").text(str);
    $("#container-virtual").show();
  } else {
    $("#container-virtual").hide();
  }

  // Phone
  if (provider.phone != null && provider.phone != "") {
    $("#container-phone").show();
    $("#data-phone").attr("href", "tel:" + provider.phone);
    $("#data-phone").text(provider.phone);
  } else {
    $("#container-phone").hide();
  }

  // Since
  if (provider.generalSince != null) {
    $("#data-since").text(provider.generalSince);
    $("#container-servicesSinceGeneral").show();
  } else {
    $("#container-servicesSinceGeneral").hide();
  }

  if (provider.gavcSince != null) {
    $("#data-sinceGA").text(provider.gavcSince);
    $("#container-servicesSinceGA").show();
  } else {
    $("#container-servicesSinceGA").hide();
  }

  if (provider.generalSince != null && provider.gavcSince != null) {
    $("#container-servicesSince").show();
  } else {
    $("#container-servicesSince").hide();
  }

  // Languages
  if (provider.languages != null && provider.languages.length > 0) {
    let str = "";

    for (let lang of provider.languages) {
      if (str == "") {
        str += lang;
      } else {
        str += ", " + lang;
      }
    }

    $("#data-languages").text(str);
    $("#container-languages").show();
  } else {
    $("#container-languages").hide();
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
    $("#container-goals").show();
  } else {
    $("#container-goals").hide();
  }

  ///////////////////////////////////////////////////////
  //               Trainer Provided Info               //
  ///////////////////////////////////////////////////////

  $("#data-intro").text(provider.intro);

  if (isTrainer) {
    $("#container-procedures").hide();
  } else {
    $("#data-procedures").empty();
    for (let procedure of Object.keys(provider.procedures)) {
      if (provider.procedures[procedure]) {
        const el = document.createElement("li");
        el.innerText = PROCEDURE_NAMES[procedure];
        $("#data-procedures").append(el);
      }
    }
    $("#container-procedures").show();
  }

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
    $("#data-provider-identities").text(provider.additionalIdentity);

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

const PROVIDER = {
  searchProviders: searchProviders,
  generateProviders: generateProviders,
  getMarkers: getMarkers,
};

export default PROVIDER;
