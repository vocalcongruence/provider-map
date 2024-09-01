import PROVIDER from "./provider.js";

const MODE_ANY = 0;
const MODE_TRAINERS = 1;
const MODE_SURGEONS = 2;

const TAB_FILTER = 0;
const TAB_LIST = 1;
const TAB_SEARCH = 2;

function getProviderTypeToSearch() {
  return $("#opt-providerType").val();
}

function isMobile() {
  return window.innerWidth < 600;
}

function showModal(doShow) {
  if (doShow || $("#introModal").is(":hidden")) {
    $("#introModal").show();
  } else {
    $("#introModal").hide();
  }
}

function showLeftPanel(doShow) {
  if (doShow || $("#panel-left").is(":hidden")) {
    $("#panel-left").show();

    if (isMobile()) {
      let pos = window.innerHeight * 0.4 - 32;
      $("#button-openLeftPanel").animate({ top: pos + "px" }, 400, "swing");
      $("#panel-left").animate({ top: "40vh" }, 400, "swing");
      $("#button-closeLeftPanel").show();
    } else {
      $("#panel-left").animate({ left: "0" }, 400, "swing");
    }
  } else {
    if (isMobile()) {
      let pos = window.innerHeight - 32;

      $("#button-openLeftPanel").animate({ top: pos + "px" }, 400, "swing");
      $("#panel-left").animate({ top: "100vh" }, 400, "swing", function () {
        $("#button-closeLeftPanel").hide();
      });
    } else {
      $("#panel-left").animate({ left: "-400px" }, 400, "swing", function () {
        $(this).hide();
      });
    }
  }
}

function showRightPanel(doShow) {
  if (doShow || $("#panel-right").is(":hidden")) {
    $("#panel-right").removeAttr('hidden');

    if (isMobile()) {
      let pos = window.innerHeight * 0.4 - 32;
      $("#panel-right").animate({ top: pos + "px" }, 400, "swing");
    } else {
      $("#panel-right").animate({ right: "0" }, 400, "swing");
    }
  } else {
    if (isMobile()) {
      $("#panel-right").animate({ top: "100vh" }, 400, "swing");
    } else {
      $("#panel-right").animate({ right: "-400px" }, 400, "swing", function () {
        $(this).attr("hidden", "true");
      });
    }

    for (let marker of PROVIDER.getMarkers()) {
      marker.content.classList.remove("highlight");
    }
  }
}

function openTab(tab) {
  tab == TAB_FILTER ? $("#panel-left-tabFilter").removeAttr('hidden') : $("#panel-left-tabFilter").attr("hidden", "true");
  tab == TAB_LIST ? $("#panel-left-tabList").removeAttr('hidden') : $("#panel-left-tabList").attr("hidden", "true");
  tab == TAB_SEARCH ? $("#panel-left-tabSearch").removeAttr('hidden') : $("#panel-left-tabSearch").attr("hidden", "true");
}

function resetModality(e) {
  $("#btn-reset-modality").hide();
  $("#opt-modality-inPerson").prop("checked", false);
  $("#opt-modality-virtual").prop("checked", false);
}

function resetNumber(e) {
  $("#btn-reset-number").hide();
  $("#opt-number-individual").prop("checked", false);
  $("#opt-number-group").prop("checked", false);
}

function resetAllFilters() {
  console.log("meep");
  // Professional Area
  $("#opt-professionalArea-slp").prop("checked", false);
  $("#opt-professionalArea-vpst").prop("checked", false);
  $("#opt-professionalArea-tac").prop("checked", false);
  $("#opt-professionalArea-gavt").prop("checked", false);
  $("#opt-professionalArea-other").prop("checked", false);

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
  $("#opt-goal-masculine").prop("checked", false);
  $("#opt-goal-feminine").prop("checked", false);
  $("#opt-goal-androgynous").prop("checked", false);
  $("#opt-goal-singing").prop("checked", false);

  // Provider identity
  $("#opt-pi-cisman").prop("checked", false);
  $("#opt-pi-ciswoman").prop("checked", false);
  $("#opt-pi-transman").prop("checked", false);
  $("#opt-pi-transwoman").prop("checked", false);
  $("#opt-pi-nonbinary").prop("checked", false);
  $("#opt-pi-other").prop("checked", false);
}

function renderFilters() {
  const mode = getProviderTypeToSearch();

  // No-filter message
  if (mode == MODE_ANY) {
    $("#noTypeSelectedMessage").show();
    $("#divider-noTypeSelectedMessage").show();
  } else {
    $("#noTypeSelectedMessage").hide();
    $("#divider-noTypeSelectedMessage").hide();
  }

  // Reset button
  if (mode == MODE_TRAINERS || mode == MODE_SURGEONS) {
    $("#button-resetAllFilters").show();
    $("#divider-resetAllFilters").show();
  } else {
    $("#button-resetAllFilters").hide();
    $("#divider-resetAllFilters").hide();
  }

  // Professional Area
  if (mode == MODE_TRAINERS) {
    $("#label-professionalArea").show();
    $("#group-professionalArea").show();
  } else {
    $("#label-professionalArea").hide();
    $("#group-professionalArea").hide();
  }

  // Location
  if (mode == MODE_TRAINERS || mode == MODE_SURGEONS) {
    $("#label-location").show();
    $("#disclaimer-location").show();
    $(".divider-location").show();
    $("#opt-country").show();
    
    if (mode == MODE_SURGEONS) {
      $("#disclaimer-location").hide();
    }

    const country = $("#opt-country").val();

    if (country == "US") {
      $("#opt-state").show();
    } else {
      $("#opt-state").val("any");
      $("#opt-state").hide();
    }

    if (country == "CA") {
      $("#opt-province").show();
    } else {
      $("#opt-province").val("any");
      $("#opt-province").hide();
    }
  } else {
    $("#label-location").hide();
    $("#disclaimer-location").hide();
    $(".divider-location").hide();
    $("#opt-country").hide();
    $("#opt-state").hide();
    $("#opt-province").hide();
  }

  // Procedures
  if (mode == MODE_SURGEONS) {
    $("#label-procedures").show();
    $("#opt-procedure").show();
  } else {
    $("#label-procedures").hide();
    $("#opt-procedure").hide();
  }

  // Language
  if (mode == MODE_TRAINERS) {
    $("#label-language").show();
    $("#opt-language").show();
  } else {
    $("#label-language").hide();
    $("#opt-language").hide();
  }

  // Modality
  if (mode == MODE_TRAINERS) {
    $("#label-modality").show();
    $("#group-modality").show();

    const modalityValueNotAny =
      $("#opt-modality-inPerson").prop("checked") ||
      $("#opt-modality-virtual").prop("checked");

    if (modalityValueNotAny) {
      $("#btn-reset-modality").show();
    } else {
      $("#btn-reset-modality").hide();
    }
  } else {
    $("#label-modality").hide();
    $("#group-modality").hide();
    $("#btn-reset-modality").hide();
  }

  // Number
  if (mode == MODE_TRAINERS) {
    $("#label-number").show();
    $("#group-number").show();

    const numberValueNotAny =
      $("#opt-number-individual").prop("checked") ||
      $("#opt-number-group").prop("checked");

    if (numberValueNotAny) {
      $("#btn-reset-number").show();
    } else {
      $("#btn-reset-number").hide();
    }
  } else {
    $("#label-number").hide();
    $("#group-number").hide();
    $("#btn-reset-number").hide();
  }

  // Goal
  if (mode == MODE_TRAINERS) {
    $("#label-goal").show();
    $("#group-goal").show();
  } else {
    $("#label-goal").hide();
    $("#group-goal").hide();
  }

  // Dividers
  if (mode == MODE_TRAINERS) {
    $(".divider-trainer").show();
  } else {
    $(".divider-trainer").hide();
  }

  // Provider Identity
  if (mode == MODE_TRAINERS || mode == MODE_SURGEONS) {
    $("#label-identity").show();
    $("#group-identity").show();
  } else {
    $("#label-identity").hide();
    $("#group-identity").hide();
  }
}

const UI = {
  isMobile: isMobile,
  showModal: showModal,
  showLeftPanel: showLeftPanel,
  showRightPanel: showRightPanel,
  resetModality: resetModality,
  resetNumber: resetNumber,
  resetAllFilters: resetAllFilters,
  renderFilters: renderFilters,
  getProviderTypeToSearch: getProviderTypeToSearch,
  openTab: openTab,

  // Constants
  MODE_ANY: MODE_ANY,
  MODE_TRAINERS: MODE_TRAINERS,
  MODE_SURGEONS: MODE_SURGEONS,

  TAB_FILTER: TAB_FILTER,
  TAB_LIST: TAB_LIST,
  TAB_SEARCH: TAB_SEARCH,
};

export default UI;
