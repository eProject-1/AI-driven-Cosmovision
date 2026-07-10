// =============================================================
//  CosmoVision AI — Prisma Seed
//  Chạy: npx prisma db seed
// =============================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌌 Bắt đầu seed dữ liệu CosmoVision...')

  // -----------------------------------------------------------
  // 1. USERS
  // -----------------------------------------------------------
  console.log('👤 Seeding users...')

  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const userPassword  = await bcrypt.hash('User@123', 10)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@cosmovision.app' },
    update: {},
    create: {
      email:        'admin@cosmovision.app',
      username:     'admin',
      passwordHash: adminPassword,
      displayName:  'CosmoVision Admin',
      role:         'ADMIN',
      isVerified:   true,
      profile: {
        create: {
          location:  'Hanoi, Vietnam',
          latitude:  21.0278,
          longitude: 105.8342,
          timezone:  'Asia/Ho_Chi_Minh',
        },
      },
      preferences: {
        create: {
          experienceLevel: 'expert',
          emailAlerts:     true,
        },
      },
    },
  })

  const testUser = await prisma.user.upsert({
    where:  { email: 'user@cosmovision.app' },
    update: {},
    create: {
      email:        'user@cosmovision.app',
      username:     'stargazer',
      passwordHash: userPassword,
      displayName:  'Star Gazer',
      role:         'USER',
      isVerified:   true,
      profile: {
        create: {
          location:  'Ho Chi Minh City, Vietnam',
          latitude:  10.8231,
          longitude: 106.6297,
          timezone:  'Asia/Ho_Chi_Minh',
          bio:       'Amateur astronomer and space enthusiast.',
        },
      },
      preferences: {
        create: {
          favoritesPlanets:         ['Mars', 'Saturn'],
          favoritesConstellations:  ['Orion', 'Ursa Major'],
          experienceLevel:          'beginner',
          emailAlerts:              true,
          eventReminders:           true,
        },
      },
    },
  })

  console.log(`   ✅ Created admin: ${admin.email}`)
  console.log(`   ✅ Created user:  ${testUser.email}`)

  // -----------------------------------------------------------
  // 2. PLANETS
  // -----------------------------------------------------------
  console.log('🪐 Seeding planets...')

  const planets = [
    {
      name:               'Mercury',
      slug:               'mercury',
      type:               'terrestrial',
      description:        'The smallest planet in the Solar System and the closest world to the Sun.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
      massKg:             3.30e23,
      diameterKm:         4879,
      gravityMs2:         3.7,
      distanceFromSunAu:  0.387,
      orbitalPeriodDays:  88,
      rotationPeriodHours: 1407.6,
      avgTempCelsius:     167,
      atmosphere:         ['O2', 'Na', 'H2'],
      numberOfMoons:      0,
      hasRings:           false,
      discoveredBy:       'Known in antiquity',
      isVisible:          true,
      aiFunFacts: [
        'Mercury has a solar day that lasts longer than its year.',
        'Its cratered surface records billions of years of impacts.',
        'Mercury has no natural moons and almost no atmosphere.',
      ],
    },
    {
      name:               'Venus',
      slug:               'venus',
      type:               'terrestrial',
      description:        'The hottest planet in the Solar System, wrapped in a dense carbon dioxide atmosphere.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg',
      massKg:             4.87e24,
      diameterKm:         12104,
      gravityMs2:         8.87,
      distanceFromSunAu:  0.723,
      orbitalPeriodDays:  225,
      rotationPeriodHours: 5832.5,
      avgTempCelsius:     464,
      atmosphere:         ['CO2', 'N2', 'SO2'],
      numberOfMoons:      0,
      hasRings:           false,
      discoveredBy:       'Known in antiquity',
      isVisible:          true,
      aiFunFacts: [
        'Venus rotates backward compared with most planets.',
        'One day on Venus is longer than one Venus year.',
        'Venus is the brightest natural object in the night sky after the Moon.',
      ],
    },
    {
      name:               'Earth',
      slug:               'earth',
      type:               'terrestrial',
      description:        'The blue planet and the only known world that supports life.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
      massKg:             5.97e24,
      diameterKm:         12742,
      gravityMs2:         9.81,
      distanceFromSunAu:  1.0,
      orbitalPeriodDays:  365.25,
      rotationPeriodHours: 24,
      avgTempCelsius:     15,
      atmosphere:         ['N2', 'O2', 'Ar', 'CO2'],
      numberOfMoons:      1,
      hasRings:           false,
      isVisible:          true,
      aiFunFacts: [
        'Earth is the only known planet with stable liquid water on its surface.',
        'Earth\'s magnetic field helps shield the planet from solar radiation.',
        'Earth has one unusually large natural moon compared with its size.',
      ],
    },
    {
      name:               'Mars',
      slug:               'mars',
      type:               'terrestrial',
      description:        'The Red Planet, home to the tallest volcano and one of the deepest canyon systems in the Solar System.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
      massKg:             6.39e23,
      diameterKm:         6779,
      gravityMs2:         3.72,
      distanceFromSunAu:  1.524,
      orbitalPeriodDays:  687,
      rotationPeriodHours: 24.6,
      avgTempCelsius:     -60,
      atmosphere:         ['CO2', 'N2', 'Ar'],
      numberOfMoons:      2,
      hasRings:           false,
      discoveredBy:       'Known in antiquity',
      isVisible:          true,
      aiFunFacts: [
        'Olympus Mons on Mars is the largest volcano in the Solar System.',
        'Mars looks red because iron minerals in its soil oxidize.',
        'Valles Marineris is a canyon system thousands of kilometers long.',
      ],
    },
    {
      name:               'Jupiter',
      slug:               'jupiter',
      type:               'gas_giant',
      description:        'The largest planet in the Solar System, famous for the Great Red Spot.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
      massKg:             1.90e27,
      diameterKm:         139820,
      gravityMs2:         24.79,
      distanceFromSunAu:  5.203,
      orbitalPeriodDays:  4333,
      rotationPeriodHours: 9.9,
      avgTempCelsius:     -110,
      atmosphere:         ['H2', 'He', 'CH4', 'NH3'],
      numberOfMoons:      95,
      hasRings:           true,
      discoveredBy:       'Known in antiquity',
      isVisible:          true,
      aiFunFacts: [
        'Jupiter is so large that all the other planets could fit inside it.',
        'The Great Red Spot is a giant storm that has lasted for centuries.',
        'Europa, one of Jupiter\'s moons, may hide a liquid ocean beneath its ice.',
      ],
    },
    {
      name:               'Saturn',
      slug:               'saturn',
      type:               'gas_giant',
      description:        'A gas giant with the most spectacular ring system in the Solar System.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
      massKg:             5.68e26,
      diameterKm:         116460,
      gravityMs2:         10.44,
      distanceFromSunAu:  9.537,
      orbitalPeriodDays:  10759,
      rotationPeriodHours: 10.7,
      avgTempCelsius:     -140,
      atmosphere:         ['H2', 'He', 'CH4'],
      numberOfMoons:      146,
      hasRings:           true,
      discoveredBy:       'Known in antiquity',
      isVisible:          true,
      aiFunFacts: [
        'Saturn is less dense than water, so it would float in a large enough ocean.',
        'Saturn\'s rings are made mostly of ice and rock particles.',
        'Titan, Saturn\'s largest moon, has a denser atmosphere than Earth.',
      ],
    },
    {
      name:               'Uranus',
      slug:               'uranus',
      type:               'ice_giant',
      description:        'An ice giant that rotates on its side with an extreme axial tilt.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
      massKg:             8.68e25,
      diameterKm:         50724,
      gravityMs2:         8.69,
      distanceFromSunAu:  19.19,
      orbitalPeriodDays:  30687,
      rotationPeriodHours: 17.2,
      avgTempCelsius:     -195,
      atmosphere:         ['H2', 'He', 'CH4'],
      numberOfMoons:      28,
      hasRings:           true,
      discoveredBy:       'William Herschel',
      discoveryYear:      1781,
      isVisible:          true,
      aiFunFacts: [
        'Uranus is tilted so far that its seasons last for decades.',
        'Uranus has the coldest planetary atmosphere measured in the Solar System.',
        'Uranus has faint, dark rings and many icy moons.',
      ],
    },
    {
      name:               'Neptune',
      slug:               'neptune',
      type:               'ice_giant',
      description:        'The farthest major planet, with some of the fastest winds in the Solar System.',
      imageUrl:           'https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg',
      massKg:             1.02e26,
      diameterKm:         49244,
      gravityMs2:         11.15,
      distanceFromSunAu:  30.07,
      orbitalPeriodDays:  60190,
      rotationPeriodHours: 16.1,
      avgTempCelsius:     -200,
      atmosphere:         ['H2', 'He', 'CH4'],
      numberOfMoons:      16,
      hasRings:           true,
      discoveredBy:       'Urbain Le Verrier & John Adams',
      discoveryYear:      1846,
      isVisible:          true,
      aiFunFacts: [
        'Winds on Neptune can exceed 2,000 km/h, among the fastest in the Solar System.',
        'Neptune takes about 165 Earth years to complete one orbit around the Sun.',
        'Triton, Neptune\'s largest moon, orbits backward and may be a captured Kuiper Belt object.',
      ],
    },
  ]

  for (const planet of planets) {
    await prisma.planet.upsert({
      where:  { slug: planet.slug },
      update: planet,
      create: planet,
    })
  }

  console.log(`   ✅ Seeded ${planets.length} planets`)

  // -----------------------------------------------------------
  // 3. CONSTELLATIONS
  // -----------------------------------------------------------
  console.log('⭐ Seeding constellations...')

  const constellations = [
  {
    name: "Orion",
    slug: "orion",
    latinName: "Orion",
    abbreviation: "Ori",
    family: "Orion",
    quadrant: "NQ1",
    rightAscension: "5h 30m",
    declination: "+5°",
    areaSqDeg: 594,
    visibleLatitudes: "+85° to -75°",
    mainStars: 7,
    brightestStar: "Rigel",
    bestMonth: "January",
    bestSeason: "Winter",
    description: "One of the most recognizable constellations in the night sky, representing a hunter in Greek mythology.",
    mythologicalOrigin: "In Greek mythology, Orion was a giant huntsman placed among the stars by Zeus.",
    imageUrl: null,
  },
  {
    name: "Ursa Major  ",
    slug: "ursa-major",
    latinName: "Ursa Major",
    abbreviation: "UMa",
    family: "Ursa Major",
    quadrant: "NQ2",
    rightAscension: "10h 40m",
    declination: "+55°",
    areaSqDeg: 1280,
    visibleLatitudes: "+90° to -30°",
    mainStars: 7,
    brightestStar: "Alioth",
    bestMonth: "April",
    bestSeason: "Spring",
    description: "The Great Bear is the third-largest constellation and contains the famous Big Dipper asterism.",
    mythologicalOrigin: "Zeus transformed Callisto into a bear and placed her in the sky as Ursa Major.",
    imageUrl: null,
  },
  {
    name: "Scorpius",
    slug: "scorpius",
    latinName: "Scorpius",
    abbreviation: "Sco",
    family: "Zodiac",
    quadrant: "SQ4",
    rightAscension: "16h 53m",
    declination: "-30°",
    areaSqDeg: 497,
    visibleLatitudes: "+40° to -90°",
    mainStars: 18,
    brightestStar: "Antares",
    bestMonth: "July",
    bestSeason: "Summer",
    description: "A striking zodiac constellation resembling a scorpion, visible in summer skies.",
    mythologicalOrigin: "In Greek myth, Scorpius was sent by Gaia to kill Orion — they are placed on opposite sides of the sky.",
    imageUrl: null,
  },
  {
    name: "Gemini",
    slug: "gemini",
    latinName: "Gemini",
    abbreviation: "Gem",
    family: "Zodiac",
    quadrant: "NQ2",
    rightAscension: "7h 00m",
    declination: "+20°",
    areaSqDeg: 514,
    visibleLatitudes: "+90° to -60°",
    mainStars: 17,
    brightestStar: "Pollux",
    bestMonth: "February",
    bestSeason: "Winter",
    description: "The Twins constellation, featuring the bright stars Castor and Pollux.",
    mythologicalOrigin: "Castor and Pollux were twin sons of Zeus and Leda in Greek mythology, inseparable even in death.",
    imageUrl: null,
  },
  {
    name: "Leo",
    slug: "leo",
    latinName: "Leo",
    abbreviation: "Leo",
    family: "Zodiac",
    quadrant: "NQ2",
    rightAscension: "10h 40m",
    declination: "+15°",
    areaSqDeg: 947,
    visibleLatitudes: "+90° to -65°",
    mainStars: 9,
    brightestStar: "Regulus",
    bestMonth: "April",
    bestSeason: "Spring",
    description: "Leo the Lion is a prominent zodiac constellation, best viewed in spring.",
    mythologicalOrigin: "Leo represents the Nemean Lion slain by Hercules as the first of his twelve labours.",
    imageUrl: null,
  },
  {
    name: "Cassiopeia",
    slug: "cassiopeia",
    latinName: "Cassiopeia",
    abbreviation: "Cas",
    family: "Perseus",
    quadrant: "NQ1",
    rightAscension: "1h 00m",
    declination: "+60°",
    areaSqDeg: 598,
    visibleLatitudes: "+90° to -20°",
    mainStars: 5,
    brightestStar: "Schedar",
    bestMonth: "November",
    bestSeason: "Autumn",
    description: "A circumpolar constellation shaped like a W or M, named after a vain queen in Greek mythology.",
    mythologicalOrigin: "Cassiopeia was queen of Ethiopia who boasted her daughter Andromeda was more beautiful than the sea nymphs.",
    imageUrl: null,
  },
  {
    name: "Taurus",
    slug: "taurus",
    latinName: "Taurus",
    abbreviation: "Tau",
    family: "Zodiac",
    quadrant: "NQ1",
    rightAscension: "4h 42m",
    declination: "+14°",
    areaSqDeg: 797,
    visibleLatitudes: "+90° to -65°",
    mainStars: 19,
    brightestStar: "Aldebaran",
    bestMonth: "January",
    bestSeason: "Winter",
    description: "Taurus the Bull contains the Pleiades and Hyades star clusters, and hosts the Crab Nebula.",
    mythologicalOrigin: "In Greek mythology, Taurus represents Zeus disguised as a bull to court Europa.",
    imageUrl: null,
  },
  {
    name: "Aries",
    slug: "aries",
    latinName: "Aries",
    abbreviation: "Ari",
    family: "Zodiac",
    quadrant: "NQ1",
    rightAscension: "2h 38m",
    declination: "+20°",
    areaSqDeg: 441,
    visibleLatitudes: "+90° to -60°",
    mainStars: 4,
    brightestStar: "Hamal",
    bestMonth: "December",
    bestSeason: "Autumn",
    description: "Aries the Ram is a zodiac constellation marked by a compact bent line of stars.",
    mythologicalOrigin: "Aries represents the ram with the golden fleece in Greek mythology.",
    imageUrl: null,
  },
  {
    name: "Cancer",
    slug: "cancer",
    latinName: "Cancer",
    abbreviation: "Cnc",
    family: "Zodiac",
    quadrant: "NQ2",
    rightAscension: "8h 40m",
    declination: "+20°",
    areaSqDeg: 506,
    visibleLatitudes: "+90° to -60°",
    mainStars: 5,
    brightestStar: "Beta Cancri",
    bestMonth: "March",
    bestSeason: "Winter",
    description: "Cancer the Crab is a faint zodiac constellation containing the Beehive Cluster.",
    mythologicalOrigin: "Cancer represents the crab sent by Hera during Hercules's battle with the Hydra.",
    imageUrl: null,
  },
  {
    name: "Virgo",
    slug: "virgo",
    latinName: "Virgo",
    abbreviation: "Vir",
    family: "Zodiac",
    quadrant: "SQ3",
    rightAscension: "13h 20m",
    declination: "-4°",
    areaSqDeg: 1294,
    visibleLatitudes: "+80° to -80°",
    mainStars: 9,
    brightestStar: "Spica",
    bestMonth: "May",
    bestSeason: "Spring",
    description: "Virgo the Maiden is the second-largest constellation and a prominent zodiac constellation anchored by Spica.",
    mythologicalOrigin: "Virgo is often associated with the goddess of harvest and justice in ancient traditions.",
    imageUrl: null,
  },
  {
    name: "Libra",
    slug: "libra",
    latinName: "Libra",
    abbreviation: "Lib",
    family: "Zodiac",
    quadrant: "SQ3",
    rightAscension: "15h 10m",
    declination: "-15°",
    areaSqDeg: 538,
    visibleLatitudes: "+65° to -90°",
    mainStars: 6,
    brightestStar: "Zubeneschamali",
    bestMonth: "June",
    bestSeason: "Spring",
    description: "Libra the Scales is a zodiac constellation between Virgo and Scorpius.",
    mythologicalOrigin: "Libra represents the scales of justice and is historically linked with Virgo.",
    imageUrl: null,
  },
  {
    name: "Sagittarius",
    slug: "sagittarius",
    latinName: "Sagittarius",
    abbreviation: "Sgr",
    family: "Zodiac",
    quadrant: "SQ4",
    rightAscension: "19h 00m",
    declination: "-25°",
    areaSqDeg: 867,
    visibleLatitudes: "+55° to -90°",
    mainStars: 8,
    brightestStar: "Kaus Australis",
    bestMonth: "August",
    bestSeason: "Summer",
    description: "Sagittarius the Archer contains the famous Teapot asterism near the Milky Way center.",
    mythologicalOrigin: "Sagittarius is commonly represented as a centaur archer in Greek mythology.",
    imageUrl: null,
  },
  {
    name: "Capricornus",
    slug: "capricornus",
    latinName: "Capricornus",
    abbreviation: "Cap",
    family: "Zodiac",
    quadrant: "SQ4",
    rightAscension: "21h 00m",
    declination: "-20°",
    areaSqDeg: 414,
    visibleLatitudes: "+60° to -90°",
    mainStars: 9,
    brightestStar: "Deneb Algedi",
    bestMonth: "September",
    bestSeason: "Autumn",
    description: "Capricornus the Sea Goat is a faint zodiac constellation with a broad triangular outline.",
    mythologicalOrigin: "Capricornus is associated with a mythological sea goat in ancient sky lore.",
    imageUrl: null,
  },
  {
    name: "Aquarius",
    slug: "aquarius",
    latinName: "Aquarius",
    abbreviation: "Aqr",
    family: "Zodiac",
    quadrant: "SQ4",
    rightAscension: "22h 20m",
    declination: "-10°",
    areaSqDeg: 980,
    visibleLatitudes: "+65° to -90°",
    mainStars: 10,
    brightestStar: "Sadalsuud",
    bestMonth: "October",
    bestSeason: "Autumn",
    description: "Aquarius the Water Bearer is a large zodiac constellation with a faint water-jar pattern.",
    mythologicalOrigin: "Aquarius is often linked to Ganymede, cupbearer of the gods.",
    imageUrl: null,
  },
  {
    name: "Pisces",
    slug: "pisces",
    latinName: "Pisces",
    abbreviation: "Psc",
    family: "Zodiac",
    quadrant: "NQ1",
    rightAscension: "0h 40m",
    declination: "+10°",
    areaSqDeg: 889,
    visibleLatitudes: "+90° to -65°",
    mainStars: 18,
    brightestStar: "Eta Piscium",
    bestMonth: "November",
    bestSeason: "Autumn",
    description: "Pisces the Fishes is a zodiac constellation drawn as two fish connected by a cord.",
    mythologicalOrigin: "Pisces represents two fish associated with Aphrodite and Eros in Greek mythology.",
    imageUrl: null,
  },
  {
    name: "Lyra",
    slug: "lyra",
    latinName: "Lyra",
    abbreviation: "Lyr",
    family: "Heavenly Waters",
    quadrant: "NQ4",
    rightAscension: "18h 51m",
    declination: "+36°",
    areaSqDeg: 286,
    visibleLatitudes: "+90° to -40°",
    mainStars: 5,
    brightestStar: "Vega",
    bestMonth: "August",
    bestSeason: "Summer",
    description: "A small but prominent constellation containing Vega, one of the brightest stars in the night sky.",
    mythologicalOrigin: "Lyra represents the lyre of Orpheus, placed in the stars by Zeus after Orpheus's death.",
    imageUrl: null,
  },
];

for (const c of constellations) {
  await prisma.constellation.upsert({
    where: { slug: c.slug },
    update: c,
    create: c,
  });
}
  console.log(`   ✅ Seeded ${constellations.length} constellations`)

  // -----------------------------------------------------------
  // 4. CELESTIAL EVENTS
  // -----------------------------------------------------------
  console.log('🌠 Seeding celestial events...')

  const events = [
    {
      title:       'Mưa sao băng Perseid 2025',
      slug:        'perseid-meteor-shower-2025',
      type:        'METEOR_SHOWER',
      description: 'Mưa sao băng Perseid hàng năm, một trong những màn trình diễn sao băng đẹp nhất năm.',
      details:     'Có thể quan sát tới 100 vệt sao mỗi giờ vào đêm cực điểm. Hướng nhìn: chòm sao Perseus ở phía đông bắc.',
      startDate:   new Date('2025-07-17'),
      endDate:     new Date('2025-08-24'),
      peakDate:    new Date('2025-08-12'),
      visibleFrom: ['Asia', 'Europe', 'North America'],
      isRecurring: true,
      aiSummary:   'Perseid là một trong những mưa sao băng được yêu thích nhất nhờ điều kiện quan sát thuận lợi vào mùa hè.',
    },
    {
      title:       'Nhật thực toàn phần 2026',
      slug:        'total-solar-eclipse-2026',
      type:        'ECLIPSE',
      description: 'Nhật thực toàn phần có thể quan sát từ Tây Ban Nha, Iceland và Bắc Phi.',
      details:     'Dải toàn phần đi qua Greenland, Iceland, Tây Ban Nha và Algeria. Thời gian toàn phần tối đa: 2 phút 18 giây.',
      startDate:   new Date('2026-08-12'),
      endDate:     new Date('2026-08-12'),
      peakDate:    new Date('2026-08-12'),
      visibleFrom: ['Europe', 'Africa', 'North America'],
      isRecurring: false,
    },
    {
      title:       'Sao Thổ xung đối 2025',
      slug:        'saturn-opposition-2025',
      type:        'PLANET_OPPOSITION',
      description: 'Saturn ở vị trí xung đối — gần Trái Đất nhất và sáng nhất trong năm.',
      details:     'Đây là thời điểm tốt nhất để quan sát Saturn và vành đai của nó qua kính thiên văn.',
      startDate:   new Date('2025-09-21'),
      endDate:     new Date('2025-09-21'),
      peakDate:    new Date('2025-09-21'),
      visibleFrom: ['Global'],
      isRecurring: true,
    },
    {
      title:       'Mưa sao băng Geminid 2025',
      slug:        'geminid-meteor-shower-2025',
      type:        'METEOR_SHOWER',
      description: 'Mưa sao băng mạnh nhất trong năm với tới 120 vệt sao mỗi giờ.',
      details:     'Geminid khác biệt vì nguồn gốc từ tiểu hành tinh 3200 Phaethon thay vì sao chổi.',
      startDate:   new Date('2025-12-04'),
      endDate:     new Date('2025-12-17'),
      peakDate:    new Date('2025-12-14'),
      visibleFrom: ['Global'],
      isRecurring: true,
    },
    {
      title:       'Siêu Trăng tháng 9/2025',
      slug:        'supermoon-september-2025',
      type:        'SUPERMOON',
      description: 'Trăng tròn khi Mặt Trăng ở gần Trái Đất nhất (điểm cận địa).',
      details:     'Siêu Trăng lớn hơn 14% và sáng hơn 30% so với Trăng tròn thông thường.',
      startDate:   new Date('2025-09-07'),
      endDate:     new Date('2025-09-07'),
      peakDate:    new Date('2025-09-07'),
      visibleFrom: ['Global'],
      isRecurring: false,
    },
  ]

  for (const event of events) {
    await prisma.celestialEvent.upsert({
      where:  { slug: event.slug },
      update: {},
      create: event,
    })
  }

  console.log(` Seeded ${events.length} celestial events`)
  
  // -----------------------------------------------------------
  // 5. OBSERVATORIES
  // -----------------------------------------------------------

  console.log('🔭 Seeding observatories...')
  

  // prisma/seed_observatories.js
// Chạy: node prisma/seed_observatories.js
// Hoặc tích hợp vào seed.js chính bằng cách import và gọi hàm seedObservatories()

const realVietnamObservatoryImages = {
  "hoa-lac-observatory":
    "https://upload.wikimedia.org/wikipedia/commons/6/63/Vietnam%2C_Hoa_Lac_Hi-tech_Park_%289134601395%29.jpg",
  "nha-trang-observatory":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png/1280px-Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png",
  "quy-nhon-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Skyline_of_Quy_Nhon.jpg",
  "cuc-phuong-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/f/fb/Parque_Nacional_de_Cuc_Phuong_%285182009321%29.jpg",
  "bach-ma-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/6/67/Bach_Ma_NP2.jpg",
  "bidoup-nui-ba-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bidoup_Nui_Ba_National_Park.jpg",
  "phuoc-binh-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Phuoc_Binh_from_National_Parks_office.jpg",
  "ba-vi-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/4/40/Ao_Vua_Lake%2C_Ba_Vi_National_Park_%2849357916241%29.jpg",
  "nui-chua-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/f/f5/Lo_O_Stream%2C_Nui_Chua_National_Park.jpg",
  "ta-xua-stargazing-ridge":
    "https://upload.wikimedia.org/wikipedia/commons/a/a3/T%C3%A0_X%C3%B9a_in_morning_mist.png",
  "o-quy-ho-pass-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/1/19/O_Quy_Ho_pass.jpg",
  "dong-van-karst-plateau-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/f/f5/B%C3%A3i_%C4%91%C3%A1_m%E1%BA%B7t_tr%C4%83ng_%C4%90%E1%BB%93ng_V%C4%83n_-_NKS.jpg",
  "mau-son-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/d/d2/Mau_Son.JPG",
  "pu-luong-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/1/10/Pu_Luong_National_Reserve_%2815179196484%29.jpg",
  "phong-nha-ke-bang-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/c/c9/Phongnhakebang6.jpg",
  "mang-den-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/4/47/Doithong_Hotel_Mang_Den_Vietnam.jpg",
  "langbiang-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/9/9c/Langbiang_Mountain.JPG",
  "yok-don-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Yokdon01.JPG",
  "chu-yang-sin-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Chuyangsin01.JPG",
  "mui-ne-sand-dunes-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/5/54/Mui_Ne_rough_dunes.JPG",
  "phu-quy-island-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Chualinhsonphuquy.jpg",
  "con-dao-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/5/5d/ConDao_park_dam.jpg",
  "nam-cat-tien-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/1/18/Cat_Tien_National_Park%2C_Vietnam.jpg",
}

const observatories = [
  {
    name: "Nha Trang Observatory",
    slug: "nha-trang-observatory",
    description:
      "Vietnam's first public astronomical observatory, located at Hon Chong in Nha Trang. The site includes a 50 cm optical reflector, a planetarium and a space gallery for science communication and education.",

    type: "PUBLIC",

    latitude: 12.2727,
    longitude: 109.2055,

    address: "Hon Chong, Vinh Phuoc Ward",
    city: "Nha Trang",
    province: "Khanh Hoa",
    country: "Vietnam",

    elevation: 20,

    equipment: [
      "50 cm reflector telescope",
      "CCD camera",
      "Spectral analyzer",
      "Planetarium",
      "Space gallery",
    ],

    openingHours: "Check Vietnam National Authority of Tourism / VNSC schedule",

    website: "https://vietnamtourism.gov.vn/en/tags/Nha-Trang-Observatory",

    imageUrl: realVietnamObservatoryImages["nha-trang-observatory"],

    rating: 4.7,
    reviewCount: 260,

    lightPollutionScore: 55,
    skyQualityScore: 70,

    isFeatured: true,
  },

  {
    name: "Paranal Observatory",
    slug: "paranal-observatory",
    description:
      "ESO's flagship ground-based observatory in Chile's Atacama Desert, home to the Very Large Telescope and several world-class optical and infrared facilities.",

    type: "PUBLIC",

    latitude: -24.6272,
    longitude: -70.4042,

    address: "Cerro Paranal, Atacama Desert",
    city: "Antofagasta",
    province: "Antofagasta",
    country: "Chile",

    elevation: 2635,

    equipment: [
      "Very Large Telescope",
      "Four 8.2 m Unit Telescopes",
      "Auxiliary Telescopes",
      "VISTA survey telescope",
      "VLT Survey Telescope",
    ],

    openingHours: "ESO visitor schedule",

    website: "https://www.eso.org/public/teles-instr/paranal-observatory/",

    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Paranal_Observatory.jpg",

    rating: 4.9,
    reviewCount: 1200,

    lightPollutionScore: 5,
    skyQualityScore: 98,

    isFeatured: true,
  },

  {
    name: "La Silla Observatory",
    slug: "la-silla-observatory",
    description:
      "ESO's first observatory, located 600 km north of Santiago de Chile at 2400 m altitude. La Silla is known for very dark skies and productive 4-metre class telescopes.",

    type: "PUBLIC",

    latitude: -29.2567,
    longitude: -70.7346,

    address: "La Silla, Atacama Desert",
    city: "La Serena",
    province: "Coquimbo",
    country: "Chile",

    elevation: 2400,

    equipment: [
      "3.58 m New Technology Telescope",
      "ESO 3.6 m telescope",
      "HARPS spectrograph",
      "MPG/ESO 2.2 m telescope",
      "BlackGEM",
      "ExTrA",
    ],

    openingHours: "ESO visitor schedule",

    website: "https://www.eso.org/public/teles-instr/lasilla/",

    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/La_Silla_Observatory.jpg",

    rating: 4.8,
    reviewCount: 780,

    lightPollutionScore: 8,
    skyQualityScore: 96,

    isFeatured: true,
  },

  {
    name: "ALMA Observatory",
    slug: "alma-observatory",
    description:
      "The Atacama Large Millimeter/submillimeter Array is an international radio observatory on the Chajnantor Plateau. ALMA studies cold cosmic gas, star formation and the early Universe.",

    type: "PUBLIC",

    latitude: -23.029,
    longitude: -67.755,

    address: "Chajnantor Plateau, Atacama Desert",
    city: "San Pedro de Atacama",
    province: "Antofagasta",
    country: "Chile",

    elevation: 5000,

    equipment: [
      "66 high-precision antennas",
      "Fifty 12 m antennas",
      "Four 12 m compact-array antennas",
      "Twelve 7 m compact-array antennas",
      "Millimetre/submillimetre interferometer",
    ],

    openingHours: "Science facility - check ALMA visits policy",

    website: "https://www.almaobservatory.org/en/about-alma/",

    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/ALMA_Observatory.jpg",

    rating: 4.9,
    reviewCount: 930,

    lightPollutionScore: 4,
    skyQualityScore: 99,

    isFeatured: true,
  },

  {
    name: "Royal Observatory Greenwich",
    slug: "royal-observatory-greenwich",
    description:
      "Historic public observatory in London, home of Greenwich Mean Time and the Prime Meridian Line, with astronomy galleries and the Great Equatorial Telescope.",

    type: "PUBLIC",

    latitude: 51.4769,
    longitude: -0.0005,

    address: "Blackheath Avenue, Greenwich",
    city: "London",
    province: "England",
    country: "United Kingdom",

    elevation: 47,

    equipment: [
      "Great Equatorial Telescope",
      "Prime Meridian Line",
      "Astronomy galleries",
      "Octagon Room",
    ],

    openingHours: "Ticketed public opening hours",

    website: "https://www.rmg.co.uk/royal-observatory",

    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Observatory_Greenwich.jpg",

    rating: 4.6,
    reviewCount: 21000,

    lightPollutionScore: 90,
    skyQualityScore: 35,

    isFeatured: false,
  },

  {
    name: "W. M. Keck Observatory",
    slug: "wm-keck-observatory",
    description:
      "Maunakea-based observatory operating two of the world's most scientifically productive optical and infrared telescopes for frontier astronomy research.",

    type: "PRIVATE",

    latitude: 19.8263,
    longitude: -155.4744,

    address: "Maunakea summit",
    city: "Kamuela",
    province: "Hawaii",
    country: "United States",

    elevation: 4145,

    equipment: [
      "Keck I 10 m telescope",
      "Keck II 10 m telescope",
      "Optical instruments",
      "Infrared instruments",
      "Adaptive optics",
    ],

    openingHours: "Research facility - outreach events vary",

    website: "https://keckobservatory.org/",

    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Keck_Observatory.jpg",

    rating: 4.9,
    reviewCount: 860,

    lightPollutionScore: 6,
    skyQualityScore: 97,

    isFeatured: true,
  },
  {
    name: "Cuc Phuong Stargazing Site",
    slug: "cuc-phuong-stargazing-site",
    description:
      "A forest and karst national park in Ninh Binh. This is not a formal observatory, but its distance from dense city lighting makes it useful as a public stargazing and night-sky education location during the dry season.",

    type: "STARGAZING_SITE",

    latitude: 20.3508,
    longitude: 105.5969,

    address: "Cuc Phuong National Park",
    city: "Nho Quan",
    province: "Ninh Binh",
    country: "Vietnam",

    elevation: 350,

    equipment: [
      "Portable telescope recommended",
      "Binoculars recommended",
      "Tripod recommended",
    ],

    openingHours: "Check park visitor regulations before night access",

    website: "https://en.wikipedia.org/wiki/C%C3%BAc_Ph%C6%B0%C6%A1ng_National_Park",

    imageUrl: realVietnamObservatoryImages["cuc-phuong-stargazing-site"],

    rating: 4.6,
    reviewCount: 360,

    lightPollutionScore: 25,
    skyQualityScore: 84,

    isFeatured: true,
  },
  {
    name: "Bach Ma Stargazing Site",
    slug: "bach-ma-stargazing-site",
    description:
      "Highland national park near Hue and Da Nang. It is a stargazing site rather than an observatory, with high elevation, cooler air and good horizons when weather is clear.",

    type: "STARGAZING_SITE",

    latitude: 16.1955,
    longitude: 107.853,

    address: "Bach Ma National Park",
    city: "Phu Loc",
    province: "Thua Thien Hue",
    country: "Vietnam",

    elevation: 1250,

    equipment: [
      "Portable telescope recommended",
      "Wide-angle camera",
      "Red flashlight",
    ],

    openingHours: "Check Bach Ma National Park visitor regulations before night access",

    website: "http://bachmapark.com.vn/index.php",

    imageUrl: realVietnamObservatoryImages["bach-ma-stargazing-site"],

    rating: 4.7,
    reviewCount: 420,

    lightPollutionScore: 18,
    skyQualityScore: 90,

    isFeatured: true,
  },
  {
    name: "Bidoup Nui Ba Stargazing Site",
    slug: "bidoup-nui-ba-stargazing-site",
    description:
      "A highland national park on the Langbiang Plateau in Lam Dong. It is suitable for dark-sky trips and Milky Way photography when camping or night access is legally arranged.",

    type: "STARGAZING_SITE",

    latitude: 12.176,
    longitude: 108.633,

    address: "Bidoup Nui Ba National Park",
    city: "Lac Duong",
    province: "Lam Dong",
    country: "Vietnam",

    elevation: 1600,

    equipment: [
      "Portable telescope recommended",
      "Milky Way camera setup",
      "Warm clothing",
    ],

    openingHours: "Check park tour and camping regulations",

    website: "http://bidoupnuiba.gov.vn/",

    imageUrl: realVietnamObservatoryImages["bidoup-nui-ba-stargazing-site"],

    rating: 4.8,
    reviewCount: 260,

    lightPollutionScore: 15,
    skyQualityScore: 92,

    isFeatured: true,
  },
  {
    name: "Phuoc Binh Stargazing Site",
    slug: "phuoc-binh-stargazing-site",
    description:
      "A mountainous national park in Ninh Thuan, one of Vietnam's drier provinces. It is modeled as a stargazing site because it offers darker rural skies, not fixed observatory equipment.",

    type: "STARGAZING_SITE",

    latitude: 11.975,
    longitude: 108.732,

    address: "Phuoc Binh National Park",
    city: "Bac Ai",
    province: "Ninh Thuan",
    country: "Vietnam",

    elevation: 900,

    equipment: [
      "Portable telescope recommended",
      "Binoculars recommended",
      "Star tracker",
    ],

    openingHours: "Check park visitor and camping regulations",

    website: "https://en.wikipedia.org/wiki/Ph%C6%B0%E1%BB%9Bc_B%C3%ACnh_National_Park",

    imageUrl: realVietnamObservatoryImages["phuoc-binh-stargazing-site"],

    rating: 4.5,
    reviewCount: 180,

    lightPollutionScore: 20,
    skyQualityScore: 88,

    isFeatured: false,
  },
  {
    name: "Ba Vi Stargazing Site",
    slug: "ba-vi-stargazing-site",
    description:
      "Mountain national park west of Hanoi. It is convenient for public skywatching near the capital, though sky quality is more limited by Hanoi's light pollution.",

    type: "STARGAZING_SITE",

    latitude: 21.067,
    longitude: 105.373,

    address: "Ba Vi National Park",
    city: "Ba Vi",
    province: "Hanoi",
    country: "Vietnam",

    elevation: 1000,

    equipment: [
      "Binoculars recommended",
      "Portable telescope recommended",
      "Moon and planet viewing",
    ],

    openingHours: "Check Ba Vi National Park visitor regulations before night access",

    website: "https://en.wikipedia.org/wiki/Ba_V%C3%AC_National_Park",

    imageUrl: realVietnamObservatoryImages["ba-vi-stargazing-site"],

    rating: 4.3,
    reviewCount: 520,

    lightPollutionScore: 62,
    skyQualityScore: 58,

    isFeatured: false,
  },
];

const slugifySite = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const imageSubjectOverrides = {
  "nui-chua-stargazing-site": "Nui Chua National Park",
  "dong-van-karst-plateau-stargazing-site": "Dong Van Karst Plateau Geopark",
  "pu-luong-stargazing-site": "Pu Luong Nature Reserve",
  "phong-nha-ke-bang-stargazing-site": "Phong Nha-Ke Bang National Park",
  "langbiang-stargazing-site": "Langbiang Mountain",
  "ta-dung-stargazing-site": "Ta Dung National Park",
  "yok-don-stargazing-site": "Yok Don National Park",
  "chu-yang-sin-stargazing-site": "Chu Yang Sin National Park",
  "mui-ne-sand-dunes-stargazing-site": "Mui Ne sand dunes",
  "phu-quy-island-stargazing-site": "Phu Quy island",
  "hon-ba-stargazing-site": "Hon Ba Nature Reserve",
  "nam-cat-tien-stargazing-site": "Cat Tien National Park",
  "thai-national-observatory-public-site": "National Astronomical Research Institute of Thailand",
  "chiang-dao-stargazing-site": "Doi Chiang Dao",
  "huai-nam-dang-stargazing-site": "Huai Nam Dang National Park",
  "khao-yai-stargazing-site": "Khao Yai National Park",
  "angkor-rural-stargazing-site": "Angkor Wat",
  "el-nido-stargazing-site": "El Nido, Palawan",
  "mulu-national-park-stargazing-site": "Gunung Mulu National Park",
  "south-african-astronomical-observatory-sutherland": "South African Astronomical Observatory",
  "meerkat-radio-observatory": "MeerKAT",
}

const cleanImageSubject = (name) =>
  String(name || "")
    .replace(/\bStargazing\s+(Site|Ridge)\b/gi, "")
    .replace(/\bHighland\s+Stargazing\s+Site\b/gi, "")
    .replace(/\bPublic\s+Site\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()

const buildCommonsImageUrl = (subject) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(`${subject.replace(/\s+/g, "_")}.jpg`)}`

const buildCatalogRecord = (site, index) => {
  const [name, type, latitude, longitude, city, province, country, elevation, lightPollutionScore, skyQualityScore, isFeatured = false, website = null] = site
  const isStargazing = type === "STARGAZING_SITE"
  const slug = slugifySite(name)
  const imageSubject = imageSubjectOverrides[slug] || cleanImageSubject(name)

  return {
    name,
    slug,
    description: isStargazing
      ? `${name} is a real geographic destination selected as a stargazing recommendation for its elevation, rural setting, dark coastline or wide night-sky horizon. Check local access and weather before visiting at night.`
      : `${name} is a real astronomy observatory, science facility or public astronomy destination selected for telescope research, public observing or night-sky education.`,
    type,
    latitude,
    longitude,
    address: name,
    city,
    province,
    country,
    elevation,
    website,
    imageUrl: realVietnamObservatoryImages[slug] || buildCommonsImageUrl(imageSubject),
    equipment: isStargazing
      ? ["Portable telescope recommended", "Binoculars recommended", "Tripod or star tracker"]
      : ["Research telescope", "Imaging instruments", "Spectrograph or visitor exhibits"],
    openingHours: isStargazing
      ? "Check local access, park and weather conditions"
      : "Check official visitor schedule",
    rating: isStargazing ? 4.5 : 4.7,
    reviewCount: isStargazing ? 180 + index * 7 : 320 + index * 11,
    lightPollutionScore,
    skyQualityScore,
    isFeatured,
    isActive: true,
  }
}

const extendedObservatoryCatalog = [
  ["Hoa Lac Observatory", "PUBLIC", 21.008, 105.531, "Hoa Lac", "Hanoi", "Vietnam", 35, 58, 64, true, "https://vnsc.org.vn/"],
  ["Quy Nhon Observatory", "PUBLIC", 13.756, 109.217, "Quy Nhon", "Binh Dinh", "Vietnam", 35, 48, 72, true, "https://explorasience.vn/"],
  ["Nui Chua Stargazing Site", "STARGAZING_SITE", 11.704, 109.148, "Ninh Hai", "Ninh Thuan", "Vietnam", 700, 16, 91, true],
  ["Ta Xua Stargazing Ridge", "STARGAZING_SITE", 21.308, 104.504, "Bac Yen", "Son La", "Vietnam", 1800, 18, 88, true],
  ["Y Ty Highland Stargazing Site", "STARGAZING_SITE", 22.615, 103.686, "Bat Xat", "Lao Cai", "Vietnam", 1900, 15, 90, true],
  ["O Quy Ho Pass Stargazing Site", "STARGAZING_SITE", 22.354, 103.775, "Sa Pa", "Lao Cai", "Vietnam", 2000, 24, 84],
  ["Dong Van Karst Plateau Stargazing Site", "STARGAZING_SITE", 23.277, 105.36, "Dong Van", "Ha Giang", "Vietnam", 1400, 16, 91, true],
  ["Mau Son Stargazing Site", "STARGAZING_SITE", 21.846, 106.924, "Loc Binh", "Lang Son", "Vietnam", 1500, 22, 85],
  ["Pu Luong Stargazing Site", "STARGAZING_SITE", 20.467, 105.171, "Ba Thuoc", "Thanh Hoa", "Vietnam", 900, 24, 83],
  ["Phong Nha Ke Bang Stargazing Site", "STARGAZING_SITE", 17.537, 106.151, "Bo Trach", "Quang Binh", "Vietnam", 400, 20, 87],
  ["Mang Den Stargazing Site", "STARGAZING_SITE", 14.599, 108.292, "Kon Plong", "Kon Tum", "Vietnam", 1200, 18, 89],
  ["Langbiang Stargazing Site", "STARGAZING_SITE", 12.047, 108.441, "Da Lat", "Lam Dong", "Vietnam", 2167, 34, 80],
  ["Ta Dung Stargazing Site", "STARGAZING_SITE", 11.893, 107.974, "Dak Glong", "Dak Nong", "Vietnam", 900, 18, 88],
  ["Yok Don Stargazing Site", "STARGAZING_SITE", 12.885, 107.77, "Buon Don", "Dak Lak", "Vietnam", 250, 22, 85],
  ["Chu Yang Sin Stargazing Site", "STARGAZING_SITE", 12.414, 108.354, "Krong Bong", "Dak Lak", "Vietnam", 1400, 16, 90],
  ["Mui Ne Sand Dunes Stargazing Site", "STARGAZING_SITE", 11.045, 108.304, "Phan Thiet", "Binh Thuan", "Vietnam", 40, 34, 78],
  ["Phu Quy Island Stargazing Site", "STARGAZING_SITE", 10.517, 108.94, "Phu Quy", "Binh Thuan", "Vietnam", 80, 20, 86],
  ["Con Dao Stargazing Site", "STARGAZING_SITE", 8.686, 106.608, "Con Dao", "Ba Ria Vung Tau", "Vietnam", 220, 18, 88],
  ["Hon Ba Stargazing Site", "STARGAZING_SITE", 12.104, 108.985, "Cam Lam", "Khanh Hoa", "Vietnam", 1578, 24, 85],
  ["Nam Cat Tien Stargazing Site", "STARGAZING_SITE", 11.423, 107.428, "Tan Phu", "Dong Nai", "Vietnam", 160, 35, 76],
  ["Doi Inthanon National Observatory", "PUBLIC", 18.588, 98.486, "Chom Thong", "Chiang Mai", "Thailand", 2457, 12, 92, true, "https://www.narit.or.th/"],
  ["Thai National Observatory Public Site", "PUBLIC", 18.795, 98.951, "Chiang Mai", "Chiang Mai", "Thailand", 330, 48, 68, false, "https://www.narit.or.th/"],
  ["Phu Chi Fa Stargazing Site", "STARGAZING_SITE", 19.85, 100.45, "Thoeng", "Chiang Rai", "Thailand", 1628, 20, 87],
  ["Chiang Dao Stargazing Site", "STARGAZING_SITE", 19.395, 98.922, "Chiang Dao", "Chiang Mai", "Thailand", 1200, 22, 85],
  ["Huai Nam Dang Stargazing Site", "STARGAZING_SITE", 19.303, 98.602, "Mae Taeng", "Chiang Mai", "Thailand", 1500, 19, 87],
  ["Khao Yai Stargazing Site", "STARGAZING_SITE", 14.439, 101.372, "Pak Chong", "Nakhon Ratchasima", "Thailand", 700, 38, 76],
  ["Vang Vieng Stargazing Site", "STARGAZING_SITE", 18.924, 102.449, "Vang Vieng", "Vientiane", "Laos", 260, 26, 82],
  ["Nong Khiaw Stargazing Site", "STARGAZING_SITE", 20.571, 102.616, "Nong Khiaw", "Luang Prabang", "Laos", 390, 18, 88],
  ["Plain of Jars Stargazing Site", "STARGAZING_SITE", 19.43, 103.154, "Phonsavan", "Xiangkhouang", "Laos", 1100, 18, 88],
  ["Bolaven Plateau Stargazing Site", "STARGAZING_SITE", 15.12, 106.09, "Paksong", "Champasak", "Laos", 1200, 19, 87],
  ["Koh Rong Samloem Stargazing Site", "STARGAZING_SITE", 10.62, 103.302, "Koh Rong Samloem", "Preah Sihanouk", "Cambodia", 20, 18, 86],
  ["Cardamom Mountains Stargazing Site", "STARGAZING_SITE", 11.995, 103.13, "Chi Phat", "Koh Kong", "Cambodia", 500, 14, 90],
  ["Phnom Kulen Stargazing Site", "STARGAZING_SITE", 13.558, 104.107, "Siem Reap", "Siem Reap", "Cambodia", 480, 30, 78],
  ["Angkor Rural Stargazing Site", "STARGAZING_SITE", 13.412, 103.867, "Siem Reap", "Siem Reap", "Cambodia", 30, 42, 72],
  ["Manila Observatory", "PUBLIC", 14.64, 121.077, "Quezon City", "Metro Manila", "Philippines", 80, 88, 38, false, "https://www.observatory.ph/"],
  ["PAGASA Astronomical Observatory", "PUBLIC", 14.646, 121.044, "Quezon City", "Metro Manila", "Philippines", 70, 88, 38, false, "https://www.pagasa.dost.gov.ph/"],
  ["Mount Pulag Stargazing Site", "STARGAZING_SITE", 16.598, 120.891, "Kabayan", "Benguet", "Philippines", 2926, 16, 90, true],
  ["Batanes Stargazing Site", "STARGAZING_SITE", 20.448, 121.97, "Basco", "Batanes", "Philippines", 120, 18, 88],
  ["El Nido Stargazing Site", "STARGAZING_SITE", 11.202, 119.416, "El Nido", "Palawan", "Philippines", 40, 24, 84],
  ["Bosscha Observatory", "PUBLIC", -6.824, 107.616, "Lembang", "West Java", "Indonesia", 1310, 55, 66, true, "https://bosscha.itb.ac.id/"],
  ["Timau National Observatory", "PUBLIC", -9.584, 123.943, "Amfoang Tengah", "East Nusa Tenggara", "Indonesia", 1300, 8, 95, true],
  ["Mount Bromo Stargazing Site", "STARGAZING_SITE", -7.942, 112.953, "Probolinggo", "East Java", "Indonesia", 2329, 20, 87],
  ["Mount Rinjani Stargazing Site", "STARGAZING_SITE", -8.411, 116.457, "Lombok", "West Nusa Tenggara", "Indonesia", 2500, 15, 91],
  ["Dieng Plateau Stargazing Site", "STARGAZING_SITE", -7.204, 109.908, "Dieng", "Central Java", "Indonesia", 2000, 25, 83],
  ["Ijen Crater Stargazing Site", "STARGAZING_SITE", -8.058, 114.242, "Banyuwangi", "East Java", "Indonesia", 2386, 18, 88],
  ["Komodo National Park Stargazing Site", "STARGAZING_SITE", -8.55, 119.489, "Labuan Bajo", "East Nusa Tenggara", "Indonesia", 200, 16, 90],
  ["Singapore Science Centre Observatory", "PUBLIC", 1.333, 103.736, "Singapore", "Singapore", "Singapore", 15, 95, 30, false, "https://www.science.edu.sg/"],
  ["Taman Negara Stargazing Site", "STARGAZING_SITE", 4.385, 102.401, "Kuala Tahan", "Pahang", "Malaysia", 120, 18, 87],
  ["Mount Kinabalu Stargazing Site", "STARGAZING_SITE", 6.075, 116.558, "Ranau", "Sabah", "Malaysia", 3000, 16, 90, true],
  ["Mulu National Park Stargazing Site", "STARGAZING_SITE", 4.047, 114.813, "Mulu", "Sarawak", "Malaysia", 100, 14, 90],
  ["Cameron Highlands Stargazing Site", "STARGAZING_SITE", 4.47, 101.38, "Tanah Rata", "Pahang", "Malaysia", 1500, 34, 78],
  ["Tioman Island Stargazing Site", "STARGAZING_SITE", 2.79, 104.169, "Tioman", "Pahang", "Malaysia", 50, 18, 87],
  ["Lowell Observatory", "PUBLIC", 35.203, -111.664, "Flagstaff", "Arizona", "United States", 2210, 18, 86, true, "https://lowell.edu/"],
  ["Griffith Observatory", "PUBLIC", 34.119, -118.3, "Los Angeles", "California", "United States", 346, 92, 36, false, "https://griffithobservatory.org/"],
  ["Palomar Observatory", "PRIVATE", 33.356, -116.865, "Palomar Mountain", "California", "United States", 1713, 30, 82, true, "https://sites.astro.caltech.edu/palomar/"],
  ["Kitt Peak National Observatory", "PUBLIC", 31.958, -111.596, "Tucson", "Arizona", "United States", 2096, 20, 88, true, "https://kpno.noirlab.edu/"],
  ["Mount Wilson Observatory", "PUBLIC", 34.225, -118.057, "Los Angeles County", "California", "United States", 1742, 64, 60, false, "https://www.mtwilson.edu/"],
  ["Lick Observatory", "PUBLIC", 37.341, -121.642, "Mount Hamilton", "California", "United States", 1283, 45, 72, false, "https://www.lickobservatory.org/"],
  ["Green Bank Observatory", "PUBLIC", 38.433, -79.839, "Green Bank", "West Virginia", "United States", 807, 14, 88, true, "https://greenbankobservatory.org/"],
  ["Cerro Tololo Inter-American Observatory", "PUBLIC", -30.169, -70.806, "Vicuna", "Coquimbo", "Chile", 2200, 8, 96, true, "https://noirlab.edu/public/programs/ctio/"],
  ["Vera C. Rubin Observatory", "PRIVATE", -30.244, -70.749, "Vicuna", "Coquimbo", "Chile", 2663, 8, 96, true, "https://rubinobservatory.org/"],
  ["Las Campanas Observatory", "PRIVATE", -29.015, -70.692, "La Serena", "Atacama", "Chile", 2380, 8, 96, true, "https://www.lco.cl/"],
  ["Gemini South Observatory", "PRIVATE", -30.241, -70.736, "Vicuna", "Coquimbo", "Chile", 2722, 8, 96, false, "https://www.gemini.edu/"],
  ["Gemini North Observatory", "PRIVATE", 19.823, -155.469, "Maunakea", "Hawaii", "United States", 4213, 6, 97, false, "https://www.gemini.edu/"],
  ["Subaru Telescope", "PRIVATE", 19.825, -155.476, "Maunakea", "Hawaii", "United States", 4139, 6, 97, false, "https://subarutelescope.org/"],
  ["Canada France Hawaii Telescope", "PRIVATE", 19.826, -155.47, "Maunakea", "Hawaii", "United States", 4204, 6, 97, false, "https://www.cfht.hawaii.edu/"],
  ["Roque de los Muchachos Observatory", "PUBLIC", 28.762, -17.879, "La Palma", "Canary Islands", "Spain", 2396, 8, 95, true, "https://www.iac.es/en/observatorios-de-canarias/roque-de-los-muchachos-observatory"],
  ["Teide Observatory", "PUBLIC", 28.3, -16.51, "Tenerife", "Canary Islands", "Spain", 2390, 12, 91, false, "https://www.iac.es/en/observatorios-de-canarias/teide-observatory"],
  ["Pic du Midi Observatory", "PUBLIC", 42.936, 0.142, "Bagneres-de-Bigorre", "Occitanie", "France", 2877, 18, 88, false, "https://www.picdumidi.com/"],
  ["Jodrell Bank Observatory", "PUBLIC", 53.236, -2.307, "Macclesfield", "Cheshire", "United Kingdom", 77, 62, 58, false, "https://www.jodrellbank.net/"],
  ["Siding Spring Observatory", "PUBLIC", -31.273, 149.064, "Coonabarabran", "New South Wales", "Australia", 1165, 14, 91, true, "https://www.sidingspringobservatory.com.au/"],
  ["Parkes Observatory", "PUBLIC", -32.998, 148.263, "Parkes", "New South Wales", "Australia", 415, 22, 84, false, "https://www.csiro.au/en/about/facilities-collections/atnf/parkes-radio-telescope"],
  ["South African Astronomical Observatory Sutherland", "PUBLIC", -32.379, 20.811, "Sutherland", "Northern Cape", "South Africa", 1798, 10, 94, true, "https://www.saao.ac.za/"],
  ["MeerKAT Radio Observatory", "PRIVATE", -30.713, 21.443, "Carnarvon", "Northern Cape", "South Africa", 1086, 8, 94, false, "https://www.sarao.ac.za/"],
].map(buildCatalogRecord)

const expandedObservatories = [
  ...observatories,
  ...extendedObservatoryCatalog,
]


const officialObservatorySlugs = expandedObservatories.map((obs) => obs.slug);

await prisma.savedObservatory.deleteMany({
  where: {
    observatory: {
      slug: {
        notIn: officialObservatorySlugs,
      },
    },
  },
});

await prisma.observatory.deleteMany({
  where: {
    slug: {
      notIn: officialObservatorySlugs,
    },
  },
});

for (const obs of expandedObservatories) {
  await prisma.observatory.upsert({
    where: { slug: obs.slug },
    update: obs,
    create: obs,
  })
}

console.log(`✅ Seeded ${expandedObservatories.length} observatories`)


  // -----------------------------------------------------------
  // 6. SAMPLE CHAT SESSION
  // -----------------------------------------------------------
  console.log(' Seeding sample chat session...')

  const session = await prisma.chatSession.create({
    data: {
      userId: testUser.id,
      title:  'Hỏi về sao Hỏa',
      messages: {
        create: [
          {
            role:      'user',
            content:   'Mars có bao nhiêu vệ tinh?',
            intent:    'PLANET_INFO',
          },
          {
            role:      'assistant',
            content:   'Mars có 2 vệ tinh tự nhiên là Phobos và Deimos. Cả hai đều có kích thước nhỏ và hình dạng không đều. Phobos lớn hơn và gần Mars hơn, còn Deimos nhỏ hơn và ở xa hơn.',
            intent:    'PLANET_INFO',
            modelUsed: 'llama-3.1-8b-instant',
            tokensUsed: 85,
          },
        ],
      },
    },
  })

  console.log(` Seeded sample chat session`)

  // -----------------------------------------------------------
  // DONE
  // -----------------------------------------------------------
  console.log('\n🚀 Seed hoàn tất!')

}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
