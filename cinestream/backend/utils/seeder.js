require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Admin = require('../models/Admin');

const sampleMovies = [
  {
    title: 'Tears of Steel',
    description: 'In a dystopian future set in Amsterdam, a group of rebel scientists and warriors attempt to stage a crucial event to save the world from destructive robotic tentacles and artificial intelligence.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    genre: ['Sci-Fi', 'Action', 'Drama'],
    year: 2023,
    duration: '12 min',
    rating: 'PG-13',
    featured: true,
    subtitles: [
      {
        label: 'English',
        src: '/uploads/subtitles/sample_en.vtt',
        srclang: 'en',
        default: true
      }
    ],
    published: true,
    views: 1420
  },
  {
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit deals with bullying forest creatures in this iconic, beautifully animated classic adventure full of humor, retribution, and heart.',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    genre: ['Animation', 'Comedy', 'Adventure'],
    year: 2022,
    duration: '10 min',
    rating: 'G',
    featured: false,
    subtitles: [
      {
        label: 'English',
        src: '/uploads/subtitles/sample_en.vtt',
        srclang: 'en',
        default: true
      }
    ],
    published: true,
    views: 3250
  },
  {
    title: 'Sintel',
    description: 'A lonely young woman searches the dangerous wilderness for a wounded baby dragon she nursed to health, facing insurmountable odds, harsh deserts, and treacherous mountain beasts.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    genre: ['Animation', 'Fantasy', 'Adventure'],
    year: 2021,
    duration: '15 min',
    rating: 'PG-13',
    featured: false,
    subtitles: [
      {
        label: 'English',
        src: '/uploads/subtitles/sample_en.vtt',
        srclang: 'en',
        default: true
      }
    ],
    published: true,
    views: 2890
  },
  {
    title: 'For Bigger Blazes',
    description: 'An adrenaline-fueled expedition into the world of extreme aerial landscapes, high-speed photography, and untamed natural wonders across mountainous terrains.',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    genre: ['Documentary', 'Adventure'],
    year: 2024,
    duration: '15 min',
    rating: 'PG',
    featured: false,
    subtitles: [],
    published: true,
    views: 940
  },
  {
    title: 'We Are Going On Bullrun',
    description: 'Documentary chronicle detailing the intense coast-to-coast endurance rally featuring legendary exotic supercars, tactical road routes, and relentless driver spirit.',
    posterUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    genre: ['Action', 'Documentary'],
    year: 2023,
    duration: '18 min',
    rating: 'PG-13',
    featured: false,
    subtitles: [],
    published: true,
    views: 1100
  },
  {
    title: 'Subaru Outback Gravity',
    description: 'Exploring uncharted trails through rugged canyons and alpine crests, testing the raw limits of all-wheel drive engineering in freezing blizzards and scorched deserts.',
    posterUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    genre: ['Adventure', 'Short'],
    year: 2024,
    duration: '10 min',
    rating: 'G',
    featured: false,
    subtitles: [],
    published: true,
    views: 730
  }
];

const seedData = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinestream';

  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seeder] MongoDB connected.');

    // 1. Ensure Admin Account
    const defaultUser = process.env.ADMIN_DEFAULT_USER || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASS || 'admin123';
    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@cinestream.local';

    let admin = await Admin.findOne({ username: defaultUser.toLowerCase() });
    if (!admin) {
      admin = new Admin({
        username: defaultUser,
        email: defaultEmail,
        password: defaultPass,
        role: 'admin'
      });
      await admin.save();
      console.log(`[Seeder] Created default admin account: "${defaultUser}" with password "${defaultPass}"`);
    } else {
      console.log(`[Seeder] Admin account "${defaultUser}" already exists.`);
    }

    // 2. Seed Movies if collection is empty or update
    const count = await Movie.countDocuments();
    if (count === 0) {
      console.log('[Seeder] No movies found in database. Seeding sample movies...');
      await Movie.insertMany(sampleMovies);
      console.log(`[Seeder] Successfully seeded ${sampleMovies.length} movies!`);
    } else {
      console.log(`[Seeder] Database already has ${count} movies.`);
    }

    console.log('[Seeder] Seeding finished successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = { seedData, sampleMovies };

if (require.main === module) {
  seedData();
}
