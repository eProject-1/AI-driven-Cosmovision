const DEFAULT_OBSERVATORY_IMAGE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/ESO_-_Milky_Way.jpg";

const GENERIC_IMAGE_URLS = new Set([
  DEFAULT_OBSERVATORY_IMAGE,
  "https://commons.wikimedia.org/wiki/Special:FilePath/Paranal_Observatory.jpg",
  "https://commons.wikimedia.org/wiki/Special:FilePath/La_Silla_Observatory.jpg",
  "https://commons.wikimedia.org/wiki/Special:FilePath/ALMA_Observatory.jpg",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Observatory_Greenwich.jpg",
]);

const REAL_THUMBNAILS = {
  "alma-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/ALMA_Antennas_on_Chajnantor.jpg/1280px-ALMA_Antennas_on_Chajnantor.jpg",
  "angkor-rural-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/960px-Angkor_Wat.jpg",
  "bach-ma-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/4/42/Thacdoquyen.jpg",
  "batanes-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sabtang_Batanes.jpg/960px-Sabtang_Batanes.jpg",
  "bidoup-nui-ba-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Tat-tan-tat-kinh-nghiem-du-lich-da-lat-checkin-o-dau-an-gi-202206031411593741.jpg",
  "bolaven-plateau-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tad_Fane_Waterfall_20251228.jpg/960px-Tad_Fane_Waterfall_20251228.jpg",
  "bosscha-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bosscha_001.JPG/960px-Bosscha_001.JPG",
  "cameron-highlands-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Tea_fields_%28Will_Ellis%29.jpg/960px-Tea_fields_%28Will_Ellis%29.jpg",
  "canada-france-hawaii-telescope": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/CFW_Telescope.JPG/960px-CFW_Telescope.JPG",
  "cardamom-mountains-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Khao_Khitchakut_National_Park_Thailand.jpg/960px-Khao_Khitchakut_National_Park_Thailand.jpg",
  "cerro-tololo-inter-american-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Blanco%27s_Open_Dome_%28Cerro-Tololo-Drone-Pic_15-CC%29_-_edit1.jpg/960px-Blanco%27s_Open_Dome_%28Cerro-Tololo-Drone-Pic_15-CC%29_-_edit1.jpg",
  "chiang-dao-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Doi_Chiang_Dao_%28I%29.jpg/960px-Doi_Chiang_Dao_%28I%29.jpg",
  "chu-yang-sin-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Krongkma4.jpg/960px-Krongkma4.jpg",
  "con-dao-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Nh%C3%A0_t%C3%B9_C%C3%B4n_%C4%90%E1%BA%A3o.JPG/1280px-Nh%C3%A0_t%C3%B9_C%C3%B4n_%C4%90%E1%BA%A3o.JPG",
  "cuc-phuong-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Parque_Nacional_de_Cuc_Phuong_%285182009321%29.jpg/1280px-Parque_Nacional_de_Cuc_Phuong_%285182009321%29.jpg",
  "griffith-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Griffith_observatory_2006.jpg/1280px-Griffith_observatory_2006.jpg",
  "la-silla-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/La_Silla_Aerial_View.jpg/1280px-La_Silla_Aerial_View.jpg",
  "langbiang-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Tat-tan-tat-kinh-nghiem-du-lich-da-lat-checkin-o-dau-an-gi-202206031411593741.jpg",
  "lowell-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Clark_dome.jpg/1280px-Clark_dome.jpg",
  "nha-trang-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png/1280px-Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png",
  "nui-chua-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Lo_O_Stream%2C_Nui_Chua_National_Park.jpg/1280px-Lo_O_Stream%2C_Nui_Chua_National_Park.jpg",
  "paranal-observatory": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Paranal_top.jpg/1280px-Paranal_top.jpg",
  "phong-nha-ke-bang-stargazing-site": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Phongnhakebang6.jpg/1280px-Phongnhakebang6.jpg",
  "royal-observatory-greenwich": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Royal_observatory_greenwich.jpg",
  "wm-keck-observatory": "https://upload.wikimedia.org/wikipedia/commons/a/af/KeckTelescopes-hi.png",
};

const VIETNAM_REAL_THUMBNAILS = {
  "hoa-lac-observatory":
    "https://upload.wikimedia.org/wikipedia/commons/6/63/Vietnam%2C_Hoa_Lac_Hi-tech_Park_%289134601395%29.jpg",
  "nha-trang-observatory":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png/1280px-Nha_Trang%2C_Kh%C3%A1nh_H%C3%B2a.png",
  "quy-nhon-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Skyline_of_Quy_Nhon.jpg",
  "cuc-phuong-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Parque_Nacional_de_Cuc_Phuong_%285182009321%29.jpg/1280px-Parque_Nacional_de_Cuc_Phuong_%285182009321%29.jpg",
  "bach-ma-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/6/67/Bach_Ma_NP2.jpg",
  "bidoup-nui-ba-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bidoup_Nui_Ba_National_Park.jpg",
  "phuoc-binh-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/e/ef/Phuoc_Binh_from_National_Parks_office.jpg",
  "ba-vi-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/4/40/Ao_Vua_Lake%2C_Ba_Vi_National_Park_%2849357916241%29.jpg",
  "nui-chua-stargazing-site":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Lo_O_Stream%2C_Nui_Chua_National_Park.jpg/1280px-Lo_O_Stream%2C_Nui_Chua_National_Park.jpg",
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
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Phongnhakebang6.jpg/1280px-Phongnhakebang6.jpg",
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
};

const OBSERVATORY_IMAGES = {
  "nha-trang-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nha_Trang_Observatory.jpg",
  "paranal-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Paranal_Observatory.jpg",
  "la-silla-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/La_Silla_Observatory.jpg",
  "alma-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/ALMA_Observatory.jpg",
  "royal-observatory-greenwich":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Observatory_Greenwich.jpg",
  "wm-keck-observatory":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Keck_Observatory.jpg",
  "cuc-phuong-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Cuc_Phuong_National_Park.jpg",
  "bach-ma-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bach_Ma_National_Park.jpg",
  "bidoup-nui-ba-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bidoup_Nui_Ba_National_Park.jpg",
  "phuoc-binh-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Phuoc_Binh_National_Park.jpg",
  "ba-vi-stargazing-site":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Ba_Vi_National_Park.jpg",
};

const IMAGE_SUBJECTS = {
  "hoa-lac-observatory": "Hoa Lac Observatory",
  "quy-nhon-observatory": "Quy Nhon Observatory",
  "nui-chua-stargazing-site": "Nui Chua National Park",
  "ta-xua-stargazing-ridge": "Ta Xua",
  "y-ty-highland-stargazing-site": "Y Ty",
  "o-quy-ho-pass-stargazing-site": "O Quy Ho Pass",
  "dong-van-karst-plateau-stargazing-site": "Dong Van Karst Plateau Geopark",
  "mau-son-stargazing-site": "Mau Son",
  "pu-luong-stargazing-site": "Pu Luong Nature Reserve",
  "phong-nha-ke-bang-stargazing-site": "Phong Nha-Ke Bang National Park",
  "mang-den-stargazing-site": "Mang Den",
  "langbiang-stargazing-site": "Langbiang Mountain",
  "ta-dung-stargazing-site": "Ta Dung National Park",
  "yok-don-stargazing-site": "Yok Don National Park",
  "chu-yang-sin-stargazing-site": "Chu Yang Sin National Park",
  "mui-ne-sand-dunes-stargazing-site": "Mui Ne sand dunes",
  "phu-quy-island-stargazing-site": "Phu Quy island",
  "con-dao-stargazing-site": "Con Dao",
  "hon-ba-stargazing-site": "Hon Ba Nature Reserve",
  "nam-cat-tien-stargazing-site": "Cat Tien National Park",
  "doi-inthanon-national-observatory": "Doi Inthanon National Observatory",
  "thai-national-observatory-public-site": "National Astronomical Research Institute of Thailand",
  "phu-chi-fa-stargazing-site": "Phu Chi Fa",
  "chiang-dao-stargazing-site": "Doi Chiang Dao",
  "huai-nam-dang-stargazing-site": "Huai Nam Dang National Park",
  "khao-yai-stargazing-site": "Khao Yai National Park",
  "vang-vieng-stargazing-site": "Vang Vieng",
  "nong-khiaw-stargazing-site": "Nong Khiaw",
  "plain-of-jars-stargazing-site": "Plain of Jars",
  "bolaven-plateau-stargazing-site": "Bolaven Plateau",
  "koh-rong-samloem-stargazing-site": "Koh Rong Samloem",
  "cardamom-mountains-stargazing-site": "Cardamom Mountains",
  "phnom-kulen-stargazing-site": "Phnom Kulen",
  "angkor-rural-stargazing-site": "Angkor Wat",
  "manila-observatory": "Manila Observatory",
  "pagasa-astronomical-observatory": "PAGASA Astronomical Observatory",
  "mount-pulag-stargazing-site": "Mount Pulag",
  "batanes-stargazing-site": "Batanes",
  "el-nido-stargazing-site": "El Nido, Palawan",
  "bosscha-observatory": "Bosscha Observatory",
  "timau-national-observatory": "Timau National Observatory",
  "mount-bromo-stargazing-site": "Mount Bromo",
  "mount-rinjani-stargazing-site": "Mount Rinjani",
  "dieng-plateau-stargazing-site": "Dieng Plateau",
  "ijen-crater-stargazing-site": "Ijen",
  "komodo-national-park-stargazing-site": "Komodo National Park",
  "singapore-science-centre-observatory": "Science Centre Observatory Singapore",
  "taman-negara-stargazing-site": "Taman Negara",
  "mount-kinabalu-stargazing-site": "Mount Kinabalu",
  "mulu-national-park-stargazing-site": "Gunung Mulu National Park",
  "cameron-highlands-stargazing-site": "Cameron Highlands",
  "tioman-island-stargazing-site": "Tioman Island",
  "lowell-observatory": "Lowell Observatory",
  "griffith-observatory": "Griffith Observatory",
  "palomar-observatory": "Palomar Observatory",
  "kitt-peak-national-observatory": "Kitt Peak National Observatory",
  "mount-wilson-observatory": "Mount Wilson Observatory",
  "lick-observatory": "Lick Observatory",
  "green-bank-observatory": "Green Bank Observatory",
  "cerro-tololo-inter-american-observatory": "Cerro Tololo Inter-American Observatory",
  "vera-c-rubin-observatory": "Vera C. Rubin Observatory",
  "las-campanas-observatory": "Las Campanas Observatory",
  "gemini-south-observatory": "Gemini South Observatory",
  "gemini-north-observatory": "Gemini North Observatory",
  "subaru-telescope": "Subaru Telescope",
  "canada-france-hawaii-telescope": "Canada-France-Hawaii Telescope",
  "roque-de-los-muchachos-observatory": "Roque de los Muchachos Observatory",
  "teide-observatory": "Teide Observatory",
  "pic-du-midi-observatory": "Pic du Midi Observatory",
  "jodrell-bank-observatory": "Jodrell Bank Observatory",
  "siding-spring-observatory": "Siding Spring Observatory",
  "parkes-observatory": "Parkes Observatory",
  "south-african-astronomical-observatory-sutherland": "South African Astronomical Observatory",
  "meerkat-radio-observatory": "MeerKAT",
};

function isStockImage(url) {
  return !url || url.includes("images.unsplash.com") || url.includes("Special:FilePath") || GENERIC_IMAGE_URLS.has(url);
}

function cleanImageSubject(name) {
  return String(name || "")
    .replace(/\bStargazing\s+(Site|Ridge)\b/gi, "")
    .replace(/\bHighland\s+Stargazing\s+Site\b/gi, "")
    .replace(/\bPublic\s+Site\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildWikiImageUrl(site) {
  if (!site?.name) return DEFAULT_OBSERVATORY_IMAGE;
  const subject = IMAGE_SUBJECTS[site?.slug] || cleanImageSubject(site.name);
  const fileName = `${subject.replace(/\s+/g, "_")}.jpg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

export function getObservatoryImage(site) {
  if (VIETNAM_REAL_THUMBNAILS[site?.slug]) return VIETNAM_REAL_THUMBNAILS[site.slug];
  if (REAL_THUMBNAILS[site?.slug]) return REAL_THUMBNAILS[site.slug];
  if (!isStockImage(site?.imageUrl)) return site.imageUrl;
  return OBSERVATORY_IMAGES[site?.slug] || buildWikiImageUrl(site);
}

export function getDefaultObservatoryImage() {
  return DEFAULT_OBSERVATORY_IMAGE;
}
