const mongoose = require('mongoose');
require('dotenv').config();

const BoothPackage = require('../models/BoothPackage');
const AddOn = require('../models/AddOn');

const packagesData = [
  {
    name: 'Anti-Gravity Standard',
    description: 'Perfect for smaller events. Includes our standard floating platform, neon light rig, and digital sharing options.',
    basePrice: 250,
    durationInHours: 2,
    features: [
      '2 Hours Operational Time',
      'Anti-Gravity Floating Camera Rig',
      'Neon Space Backdrop',
      'Digital Overlay Design',
      'Live Guest Digital Delivery (SMS/Email)',
      '1 Professional Attendant'
    ]
  },
  {
    name: 'Anti-Gravity Premium',
    description: 'Our top-tier package featuring 360-degree floating rigs, slow-motion rendering, and physical props to wow your guests.',
    basePrice: 450,
    durationInHours: 4,
    features: [
      '4 Hours Operational Time',
      '360-Degree Floating Camera Rig',
      'Green Screen & 3D Virtual Backdrops',
      'Interactive Digital Sharing Kiosk',
      'Custom Photo/Video Overlay Branding',
      'Physical Weightless Props Kit',
      'Slow-Motion Video Renderings',
      '2 Professional Attendants'
    ]
  }
];

const addOnsData = [
  {
    name: 'Custom Space Backdrop',
    price: 100,
    description: 'A custom-tailored physical or green-screen galactic backdrop specific to your event theme.'
  },
  {
    name: 'Digital Sharing Kiosk',
    price: 150,
    description: 'An independent secondary terminal for guests to view, print, and share their media without holding up the photo booth line.'
  },
  {
    name: 'Green Screen Effect Upgrade',
    price: 80,
    description: 'Unlocks custom dynamic 3D space environments for gravity-defying overlay photos.'
  },
  {
    name: 'Weightless Props Kit',
    price: 50,
    description: 'Additional selection of fun astronaut helmets, alien masks, floating tools, and space-themed props.'
  },
  {
    name: 'Slow-Motion Video Upgrade',
    price: 120,
    description: 'Enables ultra-smooth high-frame-rate rendering for cinematic action shots.'
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookingsystem';
    console.log(`Connecting to MongoDB for seeding at: ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Clear existing data
    console.log('Clearing packages and add-ons...');
    await BoothPackage.deleteMany({});
    await AddOn.deleteMany({});

    // Insert new data
    console.log('Seeding new packages...');
    const createdPackages = await BoothPackage.insertMany(packagesData);
    console.log(`Successfully seeded ${createdPackages.length} packages.`);

    console.log('Seeding new add-ons...');
    const createdAddOns = await AddOn.insertMany(addOnsData);
    console.log(`Successfully seeded ${createdAddOns.length} add-ons.`);

    console.log('Database Seeding Completed Successfully! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
