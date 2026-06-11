import { useState } from "react";
import { constellations } from "../utils/astronomyData";

const SEASONS = ["All", "Xuan", "He", "Thu", "Dong", "Quanh nam"];

export default function Constellation() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? constellations
      : constellations.filter((constellation) => constellation.season === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-20 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            Chom{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Sao
            </span>
          </h1>
          <p className="text-gray-500">Than thoai, vi tri va cach quan sat cac chom sao noi bat.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {SEASONS.map((season) => (
            <button
              key={season}
              onClick={() => setFilter(season)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === season ? "bg-purple-600 text-white" : "bg-gray-800/60 text-gray-400 hover:text-white"
              }`}
            >
              {season}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((constellation) => (
            <button
              key={constellation.id}
              onClick={() => setSelected(constellation)}
              className="group bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-blue-600/60 transition-all hover:-translate-y-1 text-left"
            >
              <div className="relative overflow-hidden h-48">
                <img
                  src={constellation.image}
                  alt={constellation.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium border"
                  style={{
                    borderColor: constellation.color,
                    color: constellation.color,
                    backgroundColor: `${constellation.color}20`,
                  }}
                >
                  {constellation.season}
                </div>
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-bold text-lg">{constellation.name}</h3>
                  <p className="text-sm" style={{ color: constellation.color }}>
                    {constellation.vietnamese}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{constellation.description}</p>
                <div className="mt-3 flex gap-4 text-xs text-gray-600">
                  <span>{constellation.stars} bright stars</span>
                  <span>{constellation.hemisphere}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700/60 rounded-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={selected.image} alt={selected.name} className="w-full h-48 object-cover rounded-t-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent rounded-t-2xl" />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center"
                aria-label="Close"
              >
                x
              </button>
              <div className="absolute bottom-4 left-5">
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p style={{ color: selected.color }}>{selected.vietnamese}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Season", val: selected.season },
                  { label: "Hemisphere", val: selected.hemisphere },
                  { label: "Main stars", val: `${selected.stars}` },
                  { label: "Brightest star", val: selected.brightestStar },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-white font-semibold text-sm">{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/30 rounded-xl p-4 border-l-2" style={{ borderColor: selected.color }}>
                <p className="text-xs text-gray-500 mb-1">Mythology</p>
                <p className="text-gray-300 text-sm">{selected.mythology}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
