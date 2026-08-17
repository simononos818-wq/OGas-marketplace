const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const lgas = [
  ["Aniocha North", ["Issele-Uku", "Idumuje-Ugboko", "Onicha-Ugbo"]],
  ["Aniocha South", ["Ogwashi-Uku", "Ubulu-Uku"]],
  ["Bomadi", ["Bomadi Town", "Kpakiama"]],
  ["Burutu", ["Burutu Town", "Ogbolubiri"]],
  ["Ethiope East", ["Abraka", "Isiokolo", "Eku"]],
  ["Ethiope West", ["Oghara", "Mosogar", "Jesse"]],
  ["Ika North East", ["Owa-Oyibu", "Owa-Alero"]],
  ["Ika South", ["Agbor", "Umunede", "Abavo"]],
  ["Isoko North", ["Ozoro", "Owhelogbo"]],
  ["Isoko South", ["Oleh", "Olomoro"]],
  ["Ndokwa East", ["Aboh", "Akarai"]],
  ["Ndokwa West", ["Kwale", "Utagba-Uno"]],
  ["Okpe", ["Orerokpe", "Oha"]],
  ["Oshimili North", ["Akwukwu-Igbo", "Ibusa"]],
  ["Oshimili South", ["Asaba", "Cable Point"]],
  ["Patani", ["Patani Town", "Tori-Angiama"]],
  ["Sapele", ["Sapele Town", "Amukpe"]],
  ["Udu", ["Otor-Udu", "Aladja", "Ekete"]],
  ["Ughelli North", ["Ughelli Town", "Ewreni", "Agbarha"]],
  ["Ughelli South", ["Otu-Jeremi", "Olomu"]],
  ["Ukwuani", ["Obiaruku", "Umutu"]],
  ["Uvwie", ["Effurun", "Enerhen", "Ugbomro"]],
  ["Warri North", ["Koko", "Ajakurama"]],
  ["Warri South", ["Warri Town", "Effurun Market", "Okere"]],
  ["Warri South West", ["Ogbe-Ijoh", "Gbaramatu"]]
];

const firstNames = ["Apex", "Divine", "Royal", "Golden", "Star", "Unity", "Grace", "Excel", "Prime", "Bright", "Faith", "Victory", "Peace", "Shalom", "Blessed", "Mega", "Super", "First", "Top", "Quick", "Swift", "Safe", "Trust", "Goodness", "Mercy", "Favour", "Success", "Progress", "Destiny"];
const lastNames = ["Gas", "Gas Depot", "Gas Plant", "Gas Hub", "Energy", "Energy Solutions", "LPG", "Gas Services", "Gas Link", "Gas Point", "Gas Spot", "Gas Center", "Gas World", "Gas Mart"];
const ownerFirst = ["John", "Grace", "Peter", "Mary", "James", "Patience", "Emmanuel", "Blessing", "Daniel", "Faith", "Joseph", "Rose", "Michael", "Sarah", "David", "Esther"];
const ownerLast = ["Ovie", "Okoro", "Efe", "Ade", "Onome", "Ese", "Omo", "Igho", "Oki", "Ede", "Osas", "Efe", "Ogho", "Aghogho"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const sellers = [];
let count = 0;

for (const [lga, areas] of lgas) {
  for (let i = 1; i <= 3; i++) {
    count++;
    const area = rand(areas);
    const bizName = `${rand(firstNames)} ${rand(lastNames)}`;
    const sellerId = `SELLER_${lga.toUpperCase().replace(/ /g, '_')}_${String(i).padStart(3, '0')}`;
    const lat = (5.1 + Math.random() * 0.9).toFixed(6);
    const lng = (5.3 + Math.random() * 1.1).toFixed(6);
    
    const price3 = randInt(1500, 1800);
    const price6 = randInt(3000, 3500);
    const price12 = randInt(6200, 7000);
    
    sellers.push({
      sellerId,
      businessName: bizName,
      ownerName: `${rand(ownerFirst)} ${rand(ownerLast)}`,
      phone: `070${randInt(10000000, 99999999)}`,
      email: `${sellerId.toLowerCase()}@ogas.ng`,
      city: lga,
      state: "Delta State",
      area: area,
      address: `No. ${randInt(1, 200)}, ${area}, ${lga}`,
      geolocation: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
      products: [
        { productId: "refill-3kg", name: "3kg Gas Refill", price: price3, stock: randInt(10, 30), unit: "per refill" },
        { productId: "refill-6kg", name: "6kg Gas Refill", price: price6, stock: randInt(8, 25), unit: "per refill" },
        { productId: "refill-12.5kg", name: "12.5kg Gas Refill", price: price12, stock: randInt(5, 20), unit: "per refill" },
      ],
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      totalOrders: randInt(0, 80),
      isActive: true,
      isVerified: true,
      deliveryRadiusKm: randInt(3, 10),
      supportsPickup: true,
      supportsDelivery: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function seed() {
  const batch = db.batch();
  for (const seller of sellers) {
    batch.set(db.collection('sellers').doc(seller.sellerId), seller);
    for (const product of seller.products) {
      batch.set(db.collection('products').doc(`${seller.sellerId}_${product.productId}`), {
        ...product,
        sellerId: seller.sellerId,
        businessName: seller.businessName,
        city: seller.city,
        area: seller.area,
        geolocation: seller.geolocation,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
  console.log(`✅ ${sellers.length} Delta sellers seeded successfully`);
  process.exit(0);
}
seed().catch(err => { console.error('❌ Error:', err); process.exit(1); });
