import { useState } from "react";
import { planets } from "../utils/astronomyData";

export default function Planets() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-20 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            He{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">
              Mat Troi
            </span>
          </h1>
          <p className="text-gray-500">Kham pha 8 hanh tinh voi thong tin chi tiet.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {planets.map((planet) => (
            <button
              key={planet.id}
              onClick={() => setSelected(planet)}
              className="group bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-purple-600/60 transition-all hover:-translate-y-1 text-left"
            >
              <div className="relative overflow-hidden">
                <img
                  src={planet.image}
                  alt={planet.name}
                  className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                <div
                  className="absolute top-3 right-3 w-3 h-3 rounded-full"
                  style={{ backgroundColor: planet.color, boxShadow: `0 0 8px ${planet.color}` }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{planet.name}</h3>
                <p className="text-purple-400 text-sm mb-2">{planet.vietnamese}</p>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{planet.description}</p>
                <div className="mt-3 flex gap-3 text-xs text-gray-600">
                  <span>{planet.moons} moons</span>
                  <span>{planet.temperature}</span>
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
            className="bg-gray-900 border border-gray-700/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={selected.image} alt={selected.name} className="w-full h-56 object-cover rounded-t-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent rounded-t-2xl" />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
                aria-label="Close"
              >
                x
              </button>
              <div className="absolute bottom-4 left-6">
                <h2 className="text-3xl font-bold">{selected.name}</h2>
                <p className="text-purple-400">{selected.vietnamese}</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-6 leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Distance from Sun", val: selected.distanceFromSun },
                  { label: "Diameter", val: selected.diameter },
                  { label: "Moons", val: `${selected.moons}` },
                  { label: "Temperature", val: selected.temperature },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-white font-semibold text-sm">{item.val}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-2">Interesting facts</h4>
                <ul className="space-y-1.5">
                  {selected.facts.map((fact) => (
                    <li key={fact} className="text-gray-400 text-sm flex gap-2">
                      <span className="text-purple-500 flex-shrink-0">-</span> {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
