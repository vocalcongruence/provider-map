const NUMBER_ANY = 0;
const NUMBER_INDIVIDUAL = 10;
const NUMBER_GROUP = 20;

const MODALITY_ANY = 0;
const MODALITY_INPERSON = 1;
const MODALITY_VIRTUAL = 2;

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
  let modality;
  if ($("#opt-modality-inPerson").prop("checked")) {
    modality = MODALITY_INPERSON;
  } else if ($("#opt-modality-virtual").prop("checked")) {
    modality = MODALITY_VIRTUAL;
  } else {
    modality = MODALITY_ANY;
  }

  // Number
  let number;
  if ($("#opt-number-individual").prop("checked")) {
    number = NUMBER_INDIVIDUAL;
  } else if ($("#opt-number-group").prop("checked")) {
    number = NUMBER_GROUP;
  } else {
    number = NUMBER_ANY;
  }

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
    p.isTrainer &&
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
        if (q.modality == MODALITY_INPERSON) {
          return false;
        } else if (!p.virtualLocations.includes(q.state)) {
          return false;
        }
      }
    }

    // Province
    if (q.country == "CA" && q.province != null && q.province != "any") {
      if (q.province != p.state) {
        // If they are a surgeon, ignore virtual locations
        if (!p.isTrainer) {
          return false;
        }

        // If not in person only, check virtual locations
        if (q.modality == MODALITY_INPERSON) {
          return false;
        } else if (!p.virtualLocations.includes(q.province)) {
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
  if (p.isTrainer) {
    const numMod = q.number + q.modality;
    let numModCheck = true;

    switch (numMod) {
      case NUMBER_ANY + MODALITY_ANY:
        numModCheck = true; // All providers will match any/any
        break;

      case NUMBER_INDIVIDUAL + MODALITY_ANY:
        numModCheck =
          p.numMods.individual_inPerson || p.numMods.individual_virtual;
        break;

      case NUMBER_INDIVIDUAL + MODALITY_INPERSON:
        numModCheck = p.numMods.individual_inPerson;
        break;

      case NUMBER_INDIVIDUAL + MODALITY_VIRTUAL:
        numModCheck = p.numMods.individual_virtual;
        break;

      case NUMBER_GROUP + MODALITY_ANY:
        numModCheck = p.numMods.group_inPerson || p.numMods.group_virtual;
        break;

      case NUMBER_GROUP + MODALITY_INPERSON:
        numModCheck = p.numMods.group_inPerson;
        break;

      case NUMBER_GROUP + MODALITY_VIRTUAL:
        numModCheck = p.numMods.group_virtual;
        break;
    }

    if (!numModCheck) {
      return false;
    }
  }

  /*if (p.isTrainer && q.number != null && q.modality == null) {
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
      p.isTrainer &&
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
    }*/

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
    let matchCiswoman =
      q.identity.ciswoman == true && p.identityFilter == "ciswoman";
    let matchNonbinary =
      q.identity.nonbinary == true && p.identityFilter == "nonbinary";
    let matchOther = q.identity.other == true && p.identityFilter == "other";
    let matchTransman =
      q.identity.transman == true && p.identityFilter == "transman";
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

const QUERY = {
  providerQuery: providerQuery,
  providerMatchesQuery: providerMatchesQuery,
};

export default QUERY;
