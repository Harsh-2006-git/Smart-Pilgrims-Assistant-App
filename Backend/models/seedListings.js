import bcrypt from "bcryptjs";
import { connectDB, sequelize } from "../config/database.js";
import Client from "./client.js";
import ParkingSlot from "./parkingSlot.js";
import StayListing from "./stayListing.js";
import StayRoom from "./stayRoom.js";

StayListing.hasMany(StayRoom, { foreignKey: "stay_id", as: "rooms" });
StayRoom.belongsTo(StayListing, { foreignKey: "stay_id", as: "listing" });

const demoOwner = {
  name: "Demo Listing Owner",
  phone: "9999900001",
  email: "demo-owner@divyayatra.local",
  userType: "ParkingOwner",
  unique_code: "RFID-DEMO-LISTING-OWNER",
};

const parkingListings = [
  {
    title: "Mahakal Corridor Premium Parking",
    description: "Covered parking close to Mahakaleshwar corridor with CCTV and staff support.",
    parkingType: "Car",
    totalSlots: 35,
    pricePerHour: 45,
    pricePerDay: 320,
    pricePerMonth: 4500,
    address: "Mahakal Lok Entry Gate, Ujjain, Madhya Pradesh",
    latitude: 23.176223,
    longitude: 75.788498,
    images: [
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200",
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200",
    ],
    startTime: "05:00:00",
    endTime: "23:30:00",
  },
  {
    title: "Ram Ghat Bike Stand",
    description: "Budget two-wheeler parking near Ram Ghat for quick darshan and river visits.",
    parkingType: "Bike",
    totalSlots: 80,
    pricePerHour: 15,
    pricePerDay: 90,
    pricePerMonth: 1200,
    address: "Ram Ghat Road, Ujjain, Madhya Pradesh",
    latitude: 23.180124,
    longitude: 75.783938,
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200"],
    startTime: "04:30:00",
    endTime: "22:30:00",
  },
];

const stayListings = [
  {
    propertyName: "Shree Mahakal Dharamshala",
    ownerName: "Demo Listing Owner",
    ownerContact: "9999900001",
    description: "Simple family-friendly rooms with food, parking, and easy access to Mahakaleshwar temple.",
    address: "Near Mahakal Lok Gate 2",
    city: "Ujjain",
    state: "Madhya Pradesh",
    routeOrTempleNearby: "Mahakaleshwar Jyotirlinga",
    stayType: "Dharamshala",
    latitude: 23.174914,
    longitude: 75.784932,
    distanceToTempleKm: 0.7,
    propertyImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200",
    ],
    facilities: {
      food: true,
      washroom: true,
      parking: true,
      familyRooms: true,
      wifi: true,
      security: true,
      medicalNearby: true,
    },
    ownerVerified: true,
    rooms: [
      {
        roomType: "Family AC Room",
        capacity: 4,
        pricePerNight: 1800,
        availableRooms: 8,
        checkInTime: "12:00",
        checkOutTime: "10:00",
        roomImages: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200"],
        sortOrder: 1,
      },
      {
        roomType: "Standard Non-AC Room",
        capacity: 3,
        pricePerNight: 950,
        availableRooms: 12,
        checkInTime: "12:00",
        checkOutTime: "10:00",
        roomImages: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200"],
        sortOrder: 2,
      },
    ],
  },
  {
    propertyName: "Kshipra Riverside Guesthouse",
    ownerName: "Demo Listing Owner",
    ownerContact: "9999900001",
    description: "Quiet guesthouse near Ram Ghat with clean rooms and early morning travel support.",
    address: "Ram Ghat Marg",
    city: "Ujjain",
    state: "Madhya Pradesh",
    routeOrTempleNearby: "Ram Ghat",
    stayType: "Guesthouse",
    latitude: 23.181302,
    longitude: 75.784764,
    distanceToTempleKm: 1.4,
    propertyImages: ["https://images.unsplash.com/photo-1521783988139-89397d761dce?w=1200"],
    facilities: {
      food: false,
      washroom: true,
      parking: false,
      familyRooms: true,
      wifi: true,
      security: true,
      medicalNearby: false,
    },
    ownerVerified: true,
    rooms: [
      {
        roomType: "River View Double Room",
        capacity: 2,
        pricePerNight: 1400,
        availableRooms: 6,
        checkInTime: "13:00",
        checkOutTime: "10:30",
        roomImages: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200"],
        sortOrder: 1,
      },
    ],
  },
];

const findOrCreateOwner = async () => {
  const [owner] = await Client.findOrCreate({
    where: { phone: demoOwner.phone },
    defaults: {
      ...demoOwner,
      password: await bcrypt.hash("demo1234", 10),
    },
  });

  return owner;
};

const seedParkingListings = async (owner) => {
  for (const listing of parkingListings) {
    const existing = await ParkingSlot.findOne({
      where: { owner_id: owner.client_id, title: listing.title },
    });

    if (existing) {
      await existing.update({
        ...listing,
        owner_id: owner.client_id,
        isActive: true,
        isApproved: true,
      });
      continue;
    }

    await ParkingSlot.create({
      ...listing,
      owner_id: owner.client_id,
      isActive: true,
      isApproved: true,
    });
  }
};

const seedStayListings = async (owner) => {
  for (const listing of stayListings) {
    const { rooms, ...listingData } = listing;
    const [stay] = await StayListing.findOrCreate({
      where: { owner_id: owner.client_id, propertyName: listing.propertyName },
      defaults: {
        ...listingData,
        owner_id: owner.client_id,
        isActive: true,
        isApproved: true,
      },
    });

    await stay.update({
      ...listingData,
      owner_id: owner.client_id,
      isActive: true,
      isApproved: true,
    });

    await StayRoom.destroy({ where: { stay_id: stay.stay_id } });
    await StayRoom.bulkCreate(
      rooms.map((room) => ({
        ...room,
        stay_id: stay.stay_id,
      }))
    );
  }
};

const seedListings = async () => {
  await connectDB();
  await sequelize.sync();

  const owner = await findOrCreateOwner();
  await seedParkingListings(owner);
  await seedStayListings(owner);

  console.log("Dummy parking and stay listings seeded successfully.");
  console.log("Demo owner login data: phone 9999900001, password demo1234");
};

seedListings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Listing seed failed:", error);
    process.exit(1);
  });
