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
      description:        'Hành tinh nhỏ nhất và gần Mặt Trời nhất trong Hệ Mặt Trời.',
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
        'Mercury có ngày dài hơn năm của nó.',
        'Bề mặt Mercury có nhiều hố thiên thạch nhất trong Hệ Mặt Trời.',
        'Mercury không có vệ tinh tự nhiên.',
      ],
    },
    {
      name:               'Venus',
      slug:               'venus',
      type:               'terrestrial',
      description:        'Hành tinh nóng nhất trong Hệ Mặt Trời với bầu khí quyển dày đặc CO2.',
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
        'Venus quay ngược chiều so với hầu hết các hành tinh khác.',
        'Một ngày trên Venus dài hơn một năm của nó.',
        'Venus là vật thể sáng nhất trên bầu trời đêm sau Mặt Trăng.',
      ],
    },
    {
      name:               'Earth',
      slug:               'earth',
      type:               'terrestrial',
      description:        'Hành tinh xanh — ngôi nhà duy nhất được biết đến có sự sống trong vũ trụ.',
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
        'Trái Đất là hành tinh duy nhất có nước lỏng trên bề mặt.',
        'Từ trường của Trái Đất bảo vệ chúng ta khỏi bức xạ mặt trời.',
        'Trái Đất có một vệ tinh tự nhiên lớn bất thường so với kích thước hành tinh.',
      ],
    },
    {
      name:               'Mars',
      slug:               'mars',
      type:               'terrestrial',
      description:        'Hành tinh Đỏ với núi lửa cao nhất và hẻm núi sâu nhất Hệ Mặt Trời.',
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
        'Olympus Mons trên Mars là núi lửa lớn nhất trong Hệ Mặt Trời.',
        'Mars có màu đỏ do oxit sắt (rỉ sét) trên bề mặt.',
        'Valles Marineris dài bằng chiều rộng của nước Mỹ.',
      ],
    },
    {
      name:               'Jupiter',
      slug:               'jupiter',
      type:               'gas_giant',
      description:        'Hành tinh lớn nhất Hệ Mặt Trời với Vết Đỏ Lớn huyền thoại.',
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
        'Jupiter lớn đến mức tất cả các hành tinh khác đều có thể vừa bên trong nó.',
        'Vết Đỏ Lớn là cơn bão đã kéo dài hơn 350 năm.',
        'Europa — một vệ tinh của Jupiter — có thể có đại dương lỏng bên dưới lớp băng.',
      ],
    },
    {
      name:               'Saturn',
      slug:               'saturn',
      type:               'gas_giant',
      description:        'Hành tinh với hệ thống vành đai ngoạn mục nhất trong Hệ Mặt Trời.',
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
        'Saturn nhẹ đến mức nó có thể nổi trên nước.',
        'Vành đai Saturn chủ yếu được cấu tạo từ băng và đá.',
        'Titan — vệ tinh của Saturn — có khí quyển dày hơn Trái Đất.',
      ],
    },
    {
      name:               'Uranus',
      slug:               'uranus',
      type:               'ice_giant',
      description:        'Hành tinh băng khổng lồ quay nghiêng 98 độ so với quỹ đạo.',
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
      isVisible:          false,
      aiFunFacts: [
        'Uranus quay nghiêng đến mức các mùa kéo dài 21 năm.',
        'Uranus là hành tinh lạnh nhất trong Hệ Mặt Trời.',
        'Uranus có 13 vành đai mỏng màu tối.',
      ],
    },
    {
      name:               'Neptune',
      slug:               'neptune',
      type:               'ice_giant',
      description:        'Hành tinh xa Mặt Trời nhất với những cơn gió mạnh nhất trong Hệ Mặt Trời.',
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
      isVisible:          false,
      aiFunFacts: [
        'Gió trên Neptune có thể đạt 2.100 km/h — nhanh nhất trong Hệ Mặt Trời.',
        'Neptune mất 165 năm để hoàn thành một vòng quanh Mặt Trời.',
        'Triton — vệ tinh của Neptune — quay ngược chiều quanh hành tinh mẹ.',
      ],
    },
  ]

  for (const planet of planets) {
    await prisma.planet.upsert({
      where:  { slug: planet.slug },
      update: {},
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
    name: "Ursa Major Minh Pham ",
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

    imageUrl:
      "https://images.unsplash.com/photo-1620589105774-b057272eff2c?auto=format&fit=crop&w=1400&q=85",

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
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1400&q=85",

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
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",

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
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",

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
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",

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
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85",

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

    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85",

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

    imageUrl:
      "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=1400&q=85",

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

    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",

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

    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85",

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

    imageUrl:
      "https://images.unsplash.com/photo-1488866022504-f2584929ca5f?auto=format&fit=crop&w=1400&q=85",

    rating: 4.3,
    reviewCount: 520,

    lightPollutionScore: 62,
    skyQualityScore: 58,

    isFeatured: false,
  },
];


const officialObservatorySlugs = observatories.map((obs) => obs.slug);

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

for (const obs of observatories) {
  await prisma.observatory.upsert({
    where: { slug: obs.slug },
    update: obs,
    create: obs,
  })
}

console.log(`✅ Seeded ${observatories.length} observatories`)


  // -----------------------------------------------------------
  // 6. COSMIC KNOWLEDGE NOTES (HOME — CHAPTER II)
  // -----------------------------------------------------------
  console.log('🌌 Seeding cosmic knowledge notes...')

  const cosmicKnowledgeNotes = [
    {
      title: 'Big Bang & Early Universe',
      slug: 'big-bang-early-universe',
      category: 'Early Universe',
      subtitle: 'From hot beginnings to a clear, expanding sky',
      body:
        'The universe began extremely hot and dense. As space expanded, matter cooled and formed stable atoms. When the early cosmic fog thinned, light traveled freely—allowing us to observe the sky today.',

      imageUrl: '/images/cosmic-notes/big-bang/cover.jpg',
      displayOrder: 1,
      ctaLabel: 'Discover More',
      isVisible: true,
      detailIntro: 'You will learn why the universe expands and why the light we see has been traveling for billions of years.',
      galleryImages: [

        '/images/cosmic-notes/big-bang/cover.jpg',
        '/images/cosmic-notes/big-bang/expansion.jpg',
        '/images/cosmic-notes/big-bang/cmb.jpg',
      ],
      keyFacts: [
        'The universe is expanding: galaxies move farther apart over time.',
        'The universe cooled after the earliest extreme heat.',
        'Old light lets us “look back” into the universe’s past.',
      ],
      timeline: [
        { label: 'The very beginning', year: 'very early', text: 'The universe was hot and dense, with energy dominating.' },
        { label: 'Expansion and cooling', year: 'a few hundred thousand years', text: 'Matter cooled enough to form stable atoms.' },
        { label: 'Becoming transparent', year: 'early', text: 'Light escaped freely, so we can observe the sky.' },
      ],
      interestingFact: 'The leftover signal from the early universe is called the “cosmic microwave background.” It helps scientists test Big Bang models.',

    },
    {
      title: 'Life Cycle of Stars',
      slug: 'life-cycle-of-stars',
      category: 'Stellar Evolution',
      subtitle: 'Birth, balance, and spectacular endings',
      body:
        'Stars form when gas and dust are pulled together by gravity. When the core becomes hot enough, nuclear fusion begins and the star settles into a stable phase. Eventually, the star runs out of fuel and ends in different ways—ranging from shedding its outer layers to ending in a supernova.',

      imageUrl: '/images/cosmic-notes/stellar-life/cover.jpg',
      displayOrder: 2,
      ctaLabel: 'Discover More',
      isVisible: true,
      detailIntro: 'Begin with a star’s birth, learn how it “shines,” and discover how its ending depends on its mass.',
      galleryImages: [
        '/images/cosmic-notes/stellar-life/cover.jpg',
        '/images/cosmic-notes/stellar-life/nebula.jpg',
        '/images/cosmic-notes/stellar-life/supernova.jpg',
      ],
      keyFacts: [
        'Stars glow because of nuclear fusion in their cores.',
        'Mass determines a star’s “path” and the way it ultimately ends.',
        'The elements created during a star’s life and death help form the next generation of stars.',
      ],
      timeline: [
        { label: 'Birth', year: 'inside a nebula', text: 'Gas and dust collapse, forming a hot core that grows denser.' },
        { label: 'Stable phase', year: 'millions to billions of years', text: 'Nuclear fusion balances gravity, keeping the star steady.' },
        { label: 'Ending', year: 'late life', text: 'Massive stars can explode as supernovae.' },
      ],
      interestingFact: 'When a star explodes, its matter and newly forged elements can mix with nearby gas—helping seed the next stars to form.',
    },
    {
      title: 'Galaxies & Nebulae',
      slug: 'galaxies-nebulae',
      category: 'Deep Space',
      subtitle: 'Where structure grows and stars take shape',
      body:
        'A galaxy is home to billions—or even hundreds of billions—of stars, as well as gas and dust. Nebulae are regions where gas collects, heats up, and eventually forms new stars. When stars are born, their winds and radiation reshape the surrounding environment—keeping the cycle of star formation going.',
      imageUrl: '/images/cosmic-notes/galaxies-nebulae/cover.jpg',
      displayOrder: 3,
      ctaLabel: 'Discover More',
      isVisible: true,
      detailIntro: 'See how galaxies build large-scale structure—and how nebulae “nurture” new stars.',
      galleryImages: [
        '/images/cosmic-notes/galaxies-nebulae/cover.jpg',
        '/images/cosmic-notes/galaxies-nebulae/andromeda.jpg',
        '/images/cosmic-notes/galaxies-nebulae/pillars.jpg',
      ],
      keyFacts: [
        'Nebulae are stellar nurseries: collapsing gas lights up when young stars form.',
        'Galaxies are never still— they interact and can merge.',
        'Light from distant regions reaches us like a “slice” of the past.',
      ],
      timeline: [
        { label: 'Star formation begins', year: 'from gas clouds', text: 'Gas and dust start to collapse under gravity.' },
        { label: 'Young stars appear', year: 'ongoing', text: 'Newborn stars ignite within the nebula.' },
        { label: 'The environment reshapes', year: 'afterward', text: 'Radiation and stellar winds alter the nebula’s shape.' },
      ],
      interestingFact: 'Some nebulae may look quiet from far away, but inside they host fast, energetic processes of star birth.',
    },
    {
      title: 'Constellations as Sky Maps',
      slug: 'constellations-sky-maps',
      category: 'Sky Cartography',
      subtitle: 'Navigate the night through patterns and meaning',
      body:
        'Constellations are imaginary “connect-the-dots” patterns drawn between bright stars to help us find our way and “read” the sky. Even though the stars in a constellation are often far apart in space, our viewpoint makes them appear to form recognizable shapes. As Earth rotates, the sky seems to shift—so constellations move through different positions across seasons.',
      imageUrl: '/images/cosmic-notes/constellations/cover.jpg',
      displayOrder: 4,
      ctaLabel: 'Discover More',
      isVisible: true,
      detailIntro: 'Use constellations like sky maps to train your observing skills and spot targets more easily.',
      galleryImages: [
        '/images/cosmic-notes/constellations/cover.jpg',
        '/images/cosmic-notes/constellations/orion.jpg',
        '/images/cosmic-notes/constellations/ancient-map.jpg',
      ],
      keyFacts: [
        'Constellations help you locate directions and observing seasons.',
        'The stars in a constellation are not necessarily close to each other in space.',
        'Constellation positions change throughout the year and from night to night.',
      ],
      timeline: [
        { label: 'Pick your landmarks', year: 'right away', text: 'Find a bright constellation to use as a “marker” in the sky.' },
        { label: 'Connect the pattern', year: 'practice', text: 'Follow the “connecting lines” to recognize common shapes.' },
        { label: 'Use the season map', year: 'by season', text: 'Revisit the sky across seasons to see how the constellations shift.' },
      ],
      interestingFact: 'Many ancient cultures used constellations to track seasonal cycles and tell stories—so each constellation can carry different meanings depending on tradition.',
    },
  ];



  for (const note of cosmicKnowledgeNotes) {
    await prisma.cosmicKnowledgeNote.upsert({
      where: { slug: note.slug },
      update: {
        title: note.title,
        category: note.category,
        subtitle: note.subtitle,
        body: note.body,
        imageUrl: note.imageUrl,
        detailIntro: note.detailIntro,
        galleryImages: note.galleryImages,
        keyFacts: note.keyFacts,
        timeline: note.timeline,
        interestingFact: note.interestingFact,
        displayOrder: note.displayOrder,
        ctaLabel: note.ctaLabel,
        isVisible: note.isVisible,
      },
      create: {
        title: note.title,
        slug: note.slug,
        category: note.category,
        subtitle: note.subtitle,
        body: note.body,
        imageUrl: note.imageUrl,
        detailIntro: note.detailIntro,
        galleryImages: note.galleryImages,
        keyFacts: note.keyFacts,
        timeline: note.timeline,
        interestingFact: note.interestingFact,
        displayOrder: note.displayOrder,
        ctaLabel: note.ctaLabel,
        isVisible: note.isVisible,
      },

    });
  }

  console.log(`   ✅ Seeded ${cosmicKnowledgeNotes.length} cosmic knowledge notes`)

  // -----------------------------------------------------------
  // 7. SAMPLE CHAT SESSION
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

