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
    name: "Ursa Major",
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
name: "Đài Thiên văn Hà Nội",
slug: "dai-thien-van-ha-noi",
description:
"Đài thiên văn lịch sử tại Hà Nội thuộc Viện Vật lý Địa cầu. Có các thiết bị quan sát và nghiên cứu thiên văn phục vụ đào tạo và nghiên cứu.",

type: "UNIVERSITY",

latitude: 21.0285,
longitude: 105.8542,

address: "18 Hoàng Quốc Việt, Cầu Giấy",
city: "Hà Nội",
province: "Hà Nội",

elevation: 10,

equipment: [
  "Kính khúc xạ 135mm",
  "Kính phản xạ 250mm",
  "Máy đo quang phổ",
],

openingHours: "Theo lịch đăng ký",

website: "https://igp-vast.vn",

imageUrl:
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564",

rating: 4.4,
reviewCount: 58,

lightPollutionScore: 82,
skyQualityScore: 40,

isFeatured: true,

},

{
name: "Trung tâm Vũ trụ Việt Nam",
slug: "trung-tam-vu-tru-viet-nam",
description:
  "Trung tâm nghiên cứu và phát triển công nghệ vũ trụ quốc gia với nhiều hoạt động phổ biến thiên văn cho cộng đồng.",

type: "PUBLIC",

latitude: 21.0365,
longitude: 105.7833,

address: "18 Hoàng Quốc Việt, Cầu Giấy",
city: "Hà Nội",
province: "Hà Nội",

elevation: 15,

equipment: [
  "Kính thiên văn quang học",
  "Anten theo dõi vệ tinh",
],

openingHours: "Theo lịch sự kiện",

website: "https://vnsc.org.vn",

imageUrl:
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",

rating: 4.7,
reviewCount: 210,

lightPollutionScore: 80,
skyQualityScore: 45,

isFeatured: true,


},

{
name: "Đài Quan sát Đà Lạt",
slug: "dai-quan-sat-da-lat",

description:
  "Điểm quan sát thiên văn nổi bật tại cao nguyên Lâm Viên với điều kiện bầu trời rất tốt cho quan sát sao.",

type: "PUBLIC",

latitude: 11.9465,
longitude: 108.4419,

address: "Phường 4, Thành phố Đà Lạt",
city: "Đà Lạt",
province: "Lâm Đồng",

elevation: 1500,

equipment: [
  "Kính thiên văn 200mm",
  "Camera CCD",
  "Bộ lọc quang phổ",
],

openingHours: "19:30 - 23:00 cuối tuần",

rating: 4.9,
reviewCount: 420,

lightPollutionScore: 25,
skyQualityScore: 92,

isFeatured: true,

},

{
name: "Vườn Quốc gia Cúc Phương",
slug: "vqg-cuc-phuong-quan-sat-sao",

description:
  "Một trong những địa điểm quan sát bầu trời đêm đẹp nhất miền Bắc với ô nhiễm ánh sáng thấp.",

type: "PUBLIC",

latitude: 20.3249,
longitude: 105.6684,

address: "Vườn Quốc gia Cúc Phương",
city: "Nho Quan",
province: "Ninh Bình",

elevation: 220,

equipment: [
  "Kính thiên văn dã ngoại",
  "Ống nhòm thiên văn",
],

openingHours: "Theo sự kiện",

website: "https://cucphuongnationalpark.com",

rating: 4.8,
reviewCount: 173,

lightPollutionScore: 20,
skyQualityScore: 90,

isFeatured: true,

},

{
name: "CLB Thiên văn Nghiệp dư TP.HCM",
slug: "clb-thien-van-nghiep-du-tphcm",
description:
  "Câu lạc bộ thiên văn dành cho cộng đồng yêu thích quan sát bầu trời tại TP.HCM.",

type: "PUBLIC",

latitude: 10.7769,
longitude: 106.7009,

address: "Công viên Tao Đàn, Quận 1",
city: "Hồ Chí Minh",
province: "Hồ Chí Minh",

elevation: 5,

equipment: [
  "Kính 80mm ED",
  "Dobsonian 8 inch",
],

openingHours: "Theo lịch sinh hoạt CLB",

rating: 4.5,
reviewCount: 95,

lightPollutionScore: 88,
skyQualityScore: 30,

isFeatured: false,
},

{
name: "Đèo Hải Vân Stargazing Point",
slug: "deo-hai-van-quan-sat-sao",
description:
  "Địa điểm lý tưởng để quan sát dải Ngân Hà và bầu trời đêm khu vực miền Trung.",

type: "PUBLIC",

latitude: 16.1833,
longitude: 108.1167,

address: "Đỉnh đèo Hải Vân",
city: "Đà Nẵng",
province: "Đà Nẵng",

elevation: 500,

equipment: [],

openingHours: "24/7",

rating: 4.8,
reviewCount: 320,

lightPollutionScore: 30,
skyQualityScore: 85,

isFeatured: true,
},

{
name: "Vườn Quốc gia Bạch Mã Stargazing Point",
slug: "vqg-bach-ma-quan-sat-sao",
description:
  "Địa điểm quan sát thiên văn chất lượng cao tại miền Trung với bầu trời rất tối.",

type: "PUBLIC",

latitude: 16.19,
longitude: 107.85,

address: "Vườn Quốc gia Bạch Mã",
city: "Phú Lộc",
province: "Thừa Thiên Huế",

elevation: 1450,

equipment: [
  "Kính thiên văn dã ngoại",
],

openingHours: "Theo mùa khô",

website: "https://bachma.gov.vn",

rating: 4.9,
reviewCount: 118,

lightPollutionScore: 15,
skyQualityScore: 95,

isFeatured: true,

},
];


for (const obs of observatories) {
  await prisma.observatory.upsert({
    where: { slug: obs.slug },
    update: obs,
    create: obs,
  })
}

console.log(`✅ Seeded ${observatories.length} observatories`)


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

 