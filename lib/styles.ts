export interface StylePillar {
  slug: string
  name: string
  tagline: string
  summary: string
  principles: { title: string; text: string }[]
  bestFor: string
  steps: string[]
}

export const STYLES: StylePillar[] = [
  {
    slug: "iwagumi",
    name: "Iwagumi",
    tagline: "Minimalist rock composition in the Japanese tradition",
    summary:
      "Iwagumi is the zen of aquascaping: a handful of carefully placed stones, a single carpeting plant and lots of open water. Rooted in the Japanese garden tradition, the layout is built around an odd number of rocks (typically three to five) that create depth, balance and calm.",
    principles: [
      { title: "Rock is the star", text: "Usually Seiryu, Manten or dragon stone. The main rock (o-yaishi) anchors the layout; secondary rocks (fuku-ishii) support it; a small accent stone (soe-ishii) adds tension. Placement follows the rule of thirds and asymmetric balance." },
      { title: "One carpet species", text: "Keep planting discipline strict: a single foreground carpet such as dwarf hairgrass, Monte Carlo or Glossostigma. Mid and background plants are rare or absent." },
      { title: "Hardscape-first design", text: "Sketch the rock arrangement before adding water or plants. Every rock should lean the same direction, and negative space is as important as the rocks themselves." },
      { title: "Patience with trimming", text: "Carpets need high light, CO₂ and regular trimming to stay low and dense. Iwagumi is a long-term commitment to weekly maintenance." },
    ],
    bestFor: "Hobbyists who love minimalism, strong discipline and a layout that looks like art. Requires CO₂ and high light — not a low-tech setup.",
    steps: [
      "Choose 3–7 stones of the same rock type and find the strongest face of each.",
      "Lay substrate on a slope — deep at the back, thin at the front — for forced perspective.",
      "Place the main rock first at roughly one-third of the tank width, then build around it.",
      "Plant a single carpet species in small patches and press it firmly into the substrate.",
      "Fill slowly, run CO₂ and high light, and trim the carpet weekly to keep it tight.",
    ],
  },
  {
    slug: "dutch",
    name: "Dutch Aquascape",
    tagline: "A riot of color, organized into ordered terraces",
    summary:
      "The Dutch style is the opposite of minimalism: a densely planted aquarium built like a flower garden, with a steep foreground-to-background terrace structure, contrasting leaf shapes and colors, and the so-called 'plant street' where groups of plants step up toward the rear.",
    principles: [
      { title: "Terrace architecture", text: "Plants step up from foreground to background in clear rows. The composition reads like an amphitheater of green, red and bronze." },
      { title: "No hardscape needed", text: "In the pure Dutch tradition the plants ARE the hardscape. Rocks and driftwood are minimal or absent entirely." },
      { title: "Plant streets", text: "Sweeping S-curves of plants, often alternating red and green species, lead the eye across the tank. Groups of the same species are kept separate and distinct." },
      { title: "Constant curation", text: "Dutch tanks are the highest-maintenance style: heavy fertilization, CO₂, and near-daily trimming to keep species proportions and the terrace lines intact." },
    ],
    bestFor: "Advanced hobbyists who enjoy gardening more than hardscaping, with time for regular trimming and dosing.",
    steps: [
      "Plan a planting map: foreground stems, midground bushy plants, background stems and a focal accent plant.",
      "Add nutrient-rich substrate; Dutch tanks are heavily planted and nutrient-hungry.",
      "Plant in ordered groups — odd numbers of stems, evenly spaced.",
      "Run high light with CO₂ and dose fertilizers on a fixed schedule.",
      "Trim and replant the tallest stems weekly to maintain the terraces.",
    ],
  },
  {
    slug: "nature-aquarium",
    name: "Nature Aquarium",
    tagline: "Recreating a slice of wild landscape in glass",
    summary:
      "The Nature Aquarium style, pioneered by Takashi Amano, turns the tank into a living landscape — a valley, a forest floor or a riverbank. It blends careful hardscape with layered plants, gentle water movement and no obvious 'designed' look: nature, curated.",
    principles: [
      { title: "The golden ratio", text: "Amano compositions place the focal point off-center using the golden ratio. A single main piece of driftwood or rock draws the eye, with subordinate hardscape supporting it." },
      { title: "Layered planting", text: "Foreground carpet, midground accent plants, background stems and epiphytes on wood create depth. Plant groups echo the hardscape's angles." },
      { title: "From two dimensions to three", text: "Good Nature Aquarium tanks look different from every angle, with layers of depth achieved through slopes, angled wood and canopy plants." },
      { title: "Water clarity and flow", text: "Gentle, even flow, crystal-clear water and low fish density let the landscape dominate. Fish play a supporting role." },
    ],
    bestFor: "Hobbyists who want a natural-looking, deep scene rather than a minimalist statement — the most popular modern style.",
    steps: [
      "Build a triangular or diagonal hardscape composition with wood and stone.",
      "Create a deep substrate slope and add a small hill at the focal point.",
      "Plant the carpet first, then epiphytes on wood, then midground and background layers.",
      "Add gentle circulation and keep CO₂ stable at 20–30 ppm.",
      "Trim in stages to preserve the silhouette; remove algae manually before it spreads.",
    ],
  },
  {
    slug: "jungle",
    name: "Jungle Style",
    tagline: "Wild, dense and untamed — nature doing its thing",
    summary:
      "The jungle style celebrates overgrowth: dense stems, floating roots, mosses and crypts that create a dark, lush, slightly chaotic environment. It looks effortless — which is the point — though it still needs firm structure to read as intentional.",
    principles: [
      { title: "Embrace overgrowth", text: "Plants grow into each other, creating a dense tangle. The scape looks like a riverbank you could reach into." },
      { title: "Layered light and shadow", text: "Floating plants and canopy plants shade the lower levels, which suits crypts, mosses and ferns that thrive in lower light." },
      { title: "Structure hides inside", text: "Driftwood and rocks provide anchor points and contrast — a massive branch climbing out of the tank is a signature element." },
      { title: "Less trimming, more removing", text: "Maintenance focuses on removing excess growth rather than shaping it into precise silhouettes." },
    ],
    bestFor: "Hobbyists who love lush growth and don't want a rigid composition. Works in high-tech, but forgiving in low-tech too.",
    steps: [
      "Start with a large piece of branching driftwood as the backbone.",
      "Plant fast-growing stems and vining plants to establish the dense look quickly.",
      "Add mosses on wood and floating plants to create shade and depth.",
      "Let the tank mature for 2–3 months before judging the final shape.",
      "Thin plants at the front so the depth layers stay visible from the glass.",
    ],
  },
  {
    slug: "biotope",
    name: "Biotope",
    tagline: "A faithful slice of one real place on Earth",
    summary:
      "A biotope tank replicates a single real habitat — an Amazon tributary, a Lake Tanganyika shoreline, a Southeast Asian blackwater stream — with the actual plants, fish, wood, stones and water chemistry found there. Nothing in a biotope should be out of place.",
    principles: [
      { title: "Research first", text: "Every element must come from the target habitat: same fish species, same plants, same substrate, same water parameters — even the same leaf litter." },
      { title: "Water chemistry matters", text: "Blackwater tanks are soft, acidic and stained by tannins; Rift Lake tanks are hard and alkaline. Replicating the chemistry is part of the craft." },
      { title: "Function over composition", text: "A biotope is judged by authenticity, not by aquascaping rules. Layout follows how the real habitat actually looks." },
      { title: "Strict stocking", text: "Only species from the target location — no 'similar looking' substitutes. This is the style's defining rule." },
    ],
    bestFor: "Hobbyists who love research, authenticity and natural history more than artistic composition.",
    steps: [
      "Pick a specific habitat and research it: water parameters, substrate, wood, plants, fish, light.",
      "Gather the correct materials — real driftwood, sand from the right particle size, leaf litter if used.",
      "Match water chemistry precisely and keep it stable.",
      "Stock only fish and plants from the target biotope.",
      "Document your choices; biotope hobbyists love sharing the 'why' behind every element.",
    ],
  },
  {
    slug: "walstad",
    name: "Walstad (El Natural)",
    tagline: "The self-sustaining, soil-based ecosystem tank",
    summary:
      "The Walstad method, named after biologist Diana Walstad, uses mineralized organic soil capped with sand to create a naturally fertilized, low-maintenance ecosystem. With no CO₂ injection, modest lighting and heavy planting, the tank runs on its own nutrient cycle — a 'planted tank that runs itself'.",
    principles: [
      { title: "Soil is the engine", text: "A layer of organic potting soil under a sand or gravel cap provides nutrients for months or years, feeding the plants that then keep the water clean." },
      { title: "Plants are the filter", text: "Dense, fast-growing plants outcompete algae and consume fish waste directly. The goal is so many plants that the water stays clear without a powerful filter." },
      { title: "Low light, no CO₂", text: "Most Walstad tanks use moderate lighting and rely on natural CO₂ from soil biology and fish. High-light species and CO₂-dependent carpets are avoided." },
      { title: "Patience in the first weeks", text: "The tank needs weeks to stabilize; ammonia spikes from the soil and algae blooms are normal as the ecosystem establishes." },
    ],
    bestFor: "Beginners and budget-minded hobbyists who want a low-maintenance tank, and anyone fascinated by self-regulating ecosystems.",
    steps: [
      "Lay 2–3 cm of organic, peat-free potting soil, well soaked.",
      "Cap with 2–4 cm of fine gravel or sand.",
      "Plant heavily from day one — fast growers like stem plants, floating plants and easy crypts.",
      "Add fish only after ammonia and nitrite read zero, then keep stocking modest.",
      "Expect a settling period of several weeks; resist heavy water changes and let plants do the work.",
    ],
  },
  {
    slug: "reef",
    name: "Reef Aquarium",
    tagline: "A living coral ecosystem with structure and color",
    summary:
      "A reef aquarium keeps live corals as the centerpiece: hard corals with calcium carbonate skeletons and soft corals, lit by strong actinic-heavy LED lighting, with powerful water movement and meticulously maintained water chemistry. It is the most technically demanding style.",
    principles: [
      { title: "Chemistry is everything", text: "Calcium, alkalinity and magnesium must be kept in tight ranges and dosed consistently. Stable parameters beat perfect ones." },
      { title: "Light like the tropics", text: "High-intensity LED fixtures with blue-dominant spectrum drive photosynthesis in corals. Light is tailored to each coral's needs." },
      { title: "Flow creates structure", text: "Randomized, turbulent flow from wavemakers brings food and oxygen to corals and sweeps detritus away." },
      { title: "Mature slowly", text: "Successful reefs are built over years. Adding corals gradually as the tank matures produces far better results than stocking fast." },
    ],
    bestFor: "Hobbyists who enjoy technology, chemistry and long-term caretaking. Not recommended as a first aquarium.",
    steps: [
      "Start with a larger tank (100 L+) for stability, good filtration and a powerful skimmer.",
      "Cycle with live rock and wait until ammonia, nitrite and nitrate are near zero.",
      "Add hardy soft corals and LPS first; leave SPS for a mature tank.",
      "Test and dose calcium, alkalinity and magnesium on a fixed schedule.",
      "Add clean-up crew and fish gradually, watching coral health after every change.",
    ],
  },
  {
    slug: "paludarium",
    name: "Paludarium",
    tagline: "Land and water in one living habitat",
    summary:
      "A paludarium combines aquatic and terrestrial zones in a single setup: water, shore and emergent plants growing above the surface, often with a fog or waterfall. It blurs the line between aquarium, terrarium and vivarium, and can host both fish and amphibious life.",
    principles: [
      { title: "The transition zone", text: "The shore — mud, moss, rocks or a waterfall — is where a paludarium earns its name. Emergent plants grow out of the water like a riverbank." },
      { title: "Water and air systems", text: "Submersible pumps drive waterfalls and misters keep the terrestrial zone humid. Filtration still matters below the surface." },
      { title: "Plants grow out", text: "Emergent growth changes the look completely: stems reach for light above the tank's rim, which is one of the style's signature visuals." },
      { title: "Habitats, not just decor", text: "The layout must genuinely serve its inhabitants — dart frogs, shrimp, small fish or crabs — with safe land, water and cover." },
    ],
    bestFor: "Hobbyists who love plants growing out of the tank, waterfalls and the intersection of aquascaping and terrarium keeping.",
    steps: [
      "Design the land/water ratio first — typical paludariums run 60–70% land.",
      "Build the land with foam, rocks and substrate, leaving space for the water basin.",
      "Install the pump, tubing and misting system before planting.",
      "Plant aquatic species below the waterline and semi-aquatic species across the transition.",
      "Introduce inhabitants last, once plants are rooted and humidity and water are stable.",
    ],
  },
]

export const STYLE_SLUGS = STYLES.map((s) => s.slug)

export function styleSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-")
}

export function getStylePillar(name: string): StylePillar | undefined {
  return STYLES.find((s) => s.slug === styleSlug(name))
}
