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
      name:           'Orion',
      slug:           'orion',
      latinName:      'Orion',
      abbreviation:   'Ori',
      description:    'Một trong những chòm sao dễ nhận biết nhất, đại diện cho người thợ săn trong thần thoại Hy Lạp.',
      mythology:      'Orion là người thợ săn vĩ đại, con trai của Poseidon. Artemis vô tình giết anh và đặt anh lên bầu trời để tưởng nhớ.',
      bestMonths:     [12, 1, 2],
      hemisphere:     'both',
      numberOfStars:  7,
      brightestStar:  'Rigel',
      aiFunFacts: [
        'Betelgeuse trong Orion là một ngôi sao siêu khổng lồ đỏ sắp nổ thành siêu tân tinh.',
        'Ba ngôi sao thắt lưng của Orion được gọi là "Tam Vương".',
        'Tinh vân Orion có thể nhìn thấy bằng mắt thường.',
      ],
    },
    {
      name:           'Ursa Major',
      slug:           'ursa-major',
      latinName:      'Ursa Major',
      abbreviation:   'UMa',
      description:    'Chòm sao Gấu Lớn, chứa Gàu Lớn — một trong những biểu tượng thiên văn nổi tiếng nhất.',
      mythology:      'Zeus biến Callisto thành gấu và đặt cô lên bầu trời cùng con trai Arcas.',
      bestMonths:     [3, 4, 5],
      hemisphere:     'northern',
      numberOfStars:  7,
      brightestStar:  'Alioth',
      aiFunFacts: [
        'Dubhe và Merak — hai ngôi sao của Gàu Lớn — chỉ thẳng đến Sao Bắc Đẩu.',
        'Ursa Major là chòm sao thứ ba lớn nhất trên bầu trời.',
        'Mizar — ngôi sao ở cán gàu — thực ra là một hệ sao đôi.',
      ],
    },
    {
      name:           'Scorpius',
      slug:           'scorpius',
      latinName:      'Scorpius',
      abbreviation:   'Sco',
      description:    'Chòm sao Bọ Cạp với ngôi sao Antares nổi tiếng màu đỏ rực.',
      mythology:      'Con bọ cạp được Gaia gửi đi để giết Orion, đó là lý do hai chòm sao này không bao giờ xuất hiện cùng nhau.',
      bestMonths:     [6, 7, 8],
      hemisphere:     'southern',
      numberOfStars:  18,
      brightestStar:  'Antares',
      aiFunFacts: [
        'Antares là một ngôi sao siêu khổng lồ đỏ lớn gấp 700 lần Mặt Trời.',
        'Scorpius và Orion không bao giờ xuất hiện đồng thời trên bầu trời.',
        'Scorpius chứa nhiều cụm sao đẹp có thể quan sát bằng ống nhòm.',
      ],
    },
    {
      name:           'Leo',
      slug:           'leo',
      latinName:      'Leo',
      abbreviation:   'Leo',
      description:    'Chòm sao Sư Tử với ngôi sao Regulus sáng rực — trái tim của sư tử.',
      mythology:      'Con sư tử Nemean bị Hercules giết trong công việc đầu tiên của 12 kỳ công huyền thoại.',
      bestMonths:     [3, 4, 5],
      hemisphere:     'northern',
      numberOfStars:  9,
      brightestStar:  'Regulus',
      aiFunFacts: [
        'Regulus là ngôi sao gần nhất với đường hoàng đạo trong số các ngôi sao sáng.',
        'Mưa sao băng Leonid xuất phát từ hướng chòm sao Leo mỗi tháng 11.',
        'Leo chứa nhiều thiên hà có thể quan sát bằng kính thiên văn nhỏ.',
      ],
    },
    {
      name:           'Cassiopeia',
      slug:           'cassiopeia',
      latinName:      'Cassiopeia',
      abbreviation:   'Cas',
      description:    'Chòm sao hình chữ W dễ nhận biết, đại diện cho nữ hoàng Cassiopeia kiêu ngạo.',
      mythology:      'Cassiopeia là nữ hoàng Ethiopia, bị trừng phạt vì kiêu ngạo khi tự so sánh mình với các nàng tiên biển.',
      bestMonths:     [10, 11, 12],
      hemisphere:     'northern',
      numberOfStars:  5,
      brightestStar:  'Schedar',
      aiFunFacts: [
        'Cassiopeia là chòm sao circumpolars — luôn nhìn thấy từ vĩ độ bắc cao.',
        'Trong năm 1572, Tycho Brahe quan sát một siêu tân tinh sáng chói trong Cassiopeia.',
        'Hình dạng chữ W của Cassiopeia giúp tìm hướng bắc khi không thấy Sao Bắc Đẩu.',
      ],
    },
  ]

  for (const constellation of constellations) {
    await prisma.constellation.upsert({
      where:  { slug: constellation.slug },
      update: {},
      create: constellation,
    })
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

  console.log(`   ✅ Seeded ${events.length} celestial events`)

  // -----------------------------------------------------------
  // 5. OBSERVATORIES
  // -----------------------------------------------------------
  console.log('🔭 Seeding observatories...')

  const observatories = [
    {
      name:         'Đài Thiên Văn Hà Nội',
      slug:         'dai-thien-van-ha-noi',
      description:  'Đài thiên văn quốc gia Việt Nam, trực thuộc Viện Hàn lâm Khoa học và Công nghệ Việt Nam.',
      country:      'Vietnam',
      city:         'Hanoi',
      latitude:     21.0285,
      longitude:    105.8542,
      isPublic:     true,
      rating:       4.2,
    },
    {
      name:         'Mauna Kea Observatories',
      slug:         'mauna-kea-observatories',
      description:  'Tổ hợp đài thiên văn lớn nhất thế giới tại đỉnh núi lửa Mauna Kea, Hawaii.',
      country:      'United States',
      city:         'Hilo, Hawaii',
      latitude:     19.8207,
      longitude:    -155.4681,
      website:      'https://www.ifa.hawaii.edu/mko/',
      rating:       4.9,
      isPublic:     true,
    },
    {
      name:         'European Southern Observatory (ESO)',
      slug:         'eso-la-silla',
      description:  'Đài thiên văn La Silla của ESO tại sa mạc Atacama, Chile — một trong những địa điểm quan sát tốt nhất thế giới.',
      country:      'Chile',
      city:         'La Serena',
      latitude:     -29.2574,
      longitude:    -70.7345,
      website:      'https://www.eso.org/public/teles-instr/lasilla/',
      rating:       4.8,
      isPublic:     true,
    },
    {
      name:         'Greenwich Royal Observatory',
      slug:         'greenwich-royal-observatory',
      description:  'Đài thiên văn hoàng gia Greenwich — nơi định nghĩa kinh tuyến gốc và GMT.',
      country:      'United Kingdom',
      city:         'London',
      latitude:     51.4769,
      longitude:    -0.0005,
      website:      'https://www.rmg.co.uk/royal-observatory',
      rating:       4.7,
      isPublic:     true,
    },
  ]

  for (const obs of observatories) {
    await prisma.observatory.upsert({
      where:  { slug: obs.slug },
      update: {},
      create: obs,
    })
  }

  console.log(`   ✅ Seeded ${observatories.length} observatories`)

  // -----------------------------------------------------------
  // 6. SAMPLE CHAT SESSION
  // -----------------------------------------------------------
  console.log('💬 Seeding sample chat session...')

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
            modelUsed: 'llama3-8b-8192',
            tokensUsed: 85,
          },
        ],
      },
    },
  })

  console.log(`   ✅ Seeded sample chat session`)

  // -----------------------------------------------------------
  // DONE
  // -----------------------------------------------------------
  console.log('\n🚀 Seed hoàn tất!')
  console.log('─────────────────────────────────────')
  console.log('📧 Admin:    admin@cosmovision.app / Admin@123')
  console.log('📧 User:     user@cosmovision.app  / User@123')
  console.log('─────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
