// Gemeinsamer Kartenkachel-Stil für alle Leaflet-Karten. Mit
// NEXT_PUBLIC_THUNDERFOREST_API_KEY: Thunderforest "Outdoors" (alpines
// Design, kommerziell nutzbarer Free-Tier). Ohne Key: Standard-OSM-Kacheln.

const THUNDERFOREST_KEY = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY;

export const TILE_LAYER = THUNDERFOREST_KEY
  ? {
      url: `https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_KEY}`,
      attribution:
        'Maps &copy; <a href="https://www.thunderforest.com">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  : {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
