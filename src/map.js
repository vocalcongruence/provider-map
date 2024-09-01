function moveTo(map, position) {
  // Center the pin
  map.panTo(position);

  // Zoom should be at least 12
  if (map.getZoom() < 12) {
    map.setZoom(12);
  }
}

const MAP = {
  moveTo: moveTo,
};

export default MAP;
