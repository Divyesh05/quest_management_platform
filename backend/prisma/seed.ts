import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.reward.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      points: 1000,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      points: 750,
    },
  });

  const anotherUser = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      password: userPassword,
      role: 'user',
      points: 500,
    },
  });

  console.log('👥 Created users');

  // Create quests
  await prisma.quest.createMany({
    data: [
      {
        title: 'Complete Your Profile',
        description: 'Fill out your profile information with accurate details. Add a profile picture, bio, and your interests.',
        reward: 50,
        difficulty: 'Easy',
        category: 'Onboarding',
        createdBy: adminUser.id,
      },
      {
        title: 'First Submission',
        description: 'Submit your first quest completion. This helps you understand how the quest system works.',
        reward: 100,
        difficulty: 'Medium',
        category: 'General',
        createdBy: adminUser.id,
      },
      {
        title: 'Help Another User',
        description: 'Assist another user with their quest or provide helpful feedback on their submission.',
        reward: 200,
        difficulty: 'Hard',
        category: 'Community',
        createdBy: adminUser.id,
      },
      {
        title: 'Daily Login Streak',
        description: 'Log in for 7 consecutive days to maintain your streak and earn bonus points.',
        reward: 150,
        difficulty: 'Easy',
        category: 'Engagement',
        createdBy: adminUser.id,
      },
      {
        title: 'Code Review Master',
        description: 'Review 5 different code submissions and provide constructive feedback.',
        reward: 300,
        difficulty: 'Hard',
        category: 'Development',
        createdBy: adminUser.id,
      },
      {
        title: 'Bug Hunter',
        description: 'Find and report a bug in the system with detailed reproduction steps.',
        reward: 250,
        difficulty: 'Medium',
        category: 'Quality Assurance',
        createdBy: adminUser.id,
      },
    ],
  });

  console.log('📋 Created quests');

  // Get the created quests for submissions and achievements
  const createdQuests = await prisma.quest.findMany();

  // Create submissions
  await prisma.submission.createMany({
    data: [
      {
        userId: regularUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
        status: 'approved',
        content: 'I completed my profile setup with a bio and profile picture. Added my interests in web development and design.',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        reviewedBy: adminUser.id,
        feedback: 'Great job completing your profile! The bio is detailed and the profile picture looks professional.',
      },
      {
        userId: regularUser.id,
        questId: createdQuests[1].id, // First Submission
        status: 'pending',
        content: 'This is my first quest submission. I followed the instructions carefully and learned how the system works.',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: anotherUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
        status: 'approved',
        content: 'Profile completed with all required information. Added skills and experience section.',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        reviewedBy: adminUser.id,
        feedback: 'Excellent profile completion! Very detailed and well-organized.',
      },
    ],
  });

  console.log('📝 Created submissions');

  // Create achievements
  await prisma.achievement.createMany({
    data: [
      {
        userId: regularUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
      },
      {
        userId: anotherUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
      },
      {
        userId: regularUser.id,
        questId: createdQuests[3].id, // Daily Login Streak
      },
    ],
  });

  console.log('🏆 Created achievements');

  // Create rewards
  await prisma.reward.createMany({
    data: [
      {
        userId: adminUser.id,
        questId: createdQuests[2].id, // Help Another User
        type: 'quest_completion',
        points: 200,
        description: 'Reward for helping another user',
        metadata: { questTitle: 'Help Another User' },
      },
      {
        userId: regularUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
        type: 'quest_completion',
        points: 50,
        description: 'Reward for completing profile',
        metadata: { questTitle: 'Complete Your Profile' },
      },
      {
        userId: regularUser.id,
        questId: createdQuests[3].id, // Daily Login Streak
        type: 'bonus',
        points: 150,
        description: '7-day login streak bonus',
        metadata: { streakDays: 7 },
      },
      {
        userId: anotherUser.id,
        questId: createdQuests[0].id, // Complete Your Profile
        type: 'quest_completion',
        points: 50,
        description: 'Reward for completing profile',
        metadata: { questTitle: 'Complete Your Profile' },
      },
    ],
  });

  console.log('💰 Created rewards');

  // Update user points to match their rewards
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { points: 1000 },
  });

  await prisma.user.update({
    where: { id: regularUser.id },
    data: { points: 750 },
  });

  await prisma.user.update({
    where: { id: anotherUser.id },
    data: { points: 500 },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 3 (admin: ${adminUser.email}, user: ${regularUser.email}, user2: ${anotherUser.email})`);
  console.log(`- Quests: ${createdQuests.length}`);
  console.log(`- Submissions: 3`);
  console.log(`- Achievements: 3`);
  console.log(`- Rewards: 4`);
  console.log('\n🔑 Login Credentials:');
  console.log(`- Admin: admin@example.com / admin123`);
  console.log(`- User: user@example.com / user123`);
  console.log(`- User2: user2@example.com / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
