import { collection, addDoc, getDocs, deleteDoc, GeoPoint, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const LAGOS_LOCATIONS = [
  { name: "Gas Hub Lekki", lat: 6.4281, lng: 3.4219, area: "Lekki" },
  { name: "Island Gas Depot", lat: 6.4338, lng: 3.4155, area: "Victoria Island" },
  { name: "Mainland Energy", lat: 6.5244, lng: 3.3792, area: "Ikeja" },
  { name: "Yaba Gas Station", lat: 6.5095, lng: 3.3711, area: "Yaba" },
  { name: "Ikorodu Gas Mart", lat: 6.6144, lng: 3.5025, area: "Ikorodu" },
  { name: "Ajah Quick Gas", lat: 6.4689, lng: 3.5852, area: "Ajah" },
  { name: "Surulere Gas Plus", lat: 6.5000, lng: 3.3500, area: "Surulere" },
  { name: "Gbagada Gas Hub", lat: 6.5500, lng: 3.4000, area: "Gbagada" },
];

const INVENTORY_TEMPLATES = [
  { size: "3kg", basePrice: 2400, stock: 15 },
  { size: "5kg", basePrice: 3800, stock: 12 },
  { size: "6kg", basePrice: 4600, stock: 10 },
  { size: "12.5kg", basePrice: 9200, stock: 8 },
  { size: "25kg", basePrice: 17500, stock: 5 },
  { size: "50kg", basePrice: 34000, stock: 3 },
];

export async function seedSellers() {
  console.log("Seeding mock sellers...");
  
  for (const loc of LAGOS_LOCATIONS) {
    const inventory = INVENTORY_TEMPLATES.map(item => ({
      size: item.size,
      price: Math.round(item.basePrice * (0.9 + Math.random() * 0.2)),
      stock: Math.floor(item.stock * (0.5 + Math.random()))
    }));

    const sellerData = {
      name: loc.name,
      location: new GeoPoint(loc.lat, loc.lng),
      area: loc.area,
      isOnline: true,
      rating: 3.5 + Math.random() * 1.5,
      deliveryRadius: 5 + Math.random() * 5,
      inventory,
      phone: "+234" + Math.floor(8000000000 + Math.random() * 999999999),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      totalDeliveries: Math.floor(Math.random() * 500),
      isMock: true
    };

    try {
      const docRef = await addDoc(collection(db, "sellers"), sellerData);
      console.log("Created seller:", loc.name, "ID:", docRef.id);
    } catch (error) {
      console.error("Error creating seller:", error);
    }
  }
  
  console.log("Seeding complete!");
}

export async function clearMockSellers() {
  console.log("Clearing mock sellers...");
  const sellersRef = collection(db, "sellers");
  const snapshot = await getDocs(sellersRef);
  
  const deletePromises = snapshot.docs
    .filter(doc => doc.data().isMock)
    .map(doc => deleteDoc(doc.ref));
    
  await Promise.all(deletePromises);
  console.log("Cleared all mock sellers");
}
