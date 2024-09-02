import UI from "./ui.js";

function moveTo(map, position) {
  // Zoom should be at least 12
  if (map.getZoom() < 12) {
    map.setZoom(12);
  }


  if (UI.isMobile()) {
    map.setCenter(position);
    let offsetY = window.innerHeight * 0.3;
    map.panBy(0, offsetY);
  } else {
    // Center the pin
    map.panTo(position);
  }
}

const MAP = {
  moveTo: moveTo,
};

export default MAP;
