// Script to create/update admin user Twicefear with superadmin role
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function setupAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Import User model
        const User = require("./src/models/User");
        const { offlineUUID } = require("./src/utils/uuid");

        const adminUsername = "Twicefear";
        const adminPassword = "baiganmine1";

        // Check if admin user exists
        let adminUser = await User.findOne({ username: adminUsername });

        if (adminUser) {
            console.log(`⚠️ Admin user "${adminUsername}" already exists.`);
            console.log(`Current role: ${adminUser.role}`);
            
            // Update to superadmin if not already
            if (adminUser.role !== "superadmin") {
                adminUser.role = "superadmin";
                adminUser.coins = 999999;
                adminUser.permissions = {
                    canUploadSkins: true,
                    canUploadCapes: true,
                    canAccessPremiumMods: true,
                    canAccessPremiumPlugins: true,
                    canGiftCoins: true,
                    canBanUsers: true,
                    canEditUsers: true,
                };
                await adminUser.save();
                console.log("✅ Updated admin role to superadmin with full permissions");
            } else {
                console.log("✅ Admin already has superadmin role");
            }

            // Update password hash to ensure it matches
            const newPasswordHash = await bcrypt.hash(adminPassword, 10);
            adminUser.passwordHash = newPasswordHash;
            await adminUser.save();
            console.log("✅ Admin password updated");
        } else {
            // Create admin user
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            const uuid = offlineUUID(adminUsername);
            
            adminUser = await User.create({
                username: adminUsername,
                uuid,
                passwordHash,
                role: "superadmin",
                coins: 999999,
                permissions: {
                    canUploadSkins: true,
                    canUploadCapes: true,
                    canAccessPremiumMods: true,
                    canAccessPremiumPlugins: true,
                    canGiftCoins: true,
                    canBanUsers: true,
                    canEditUsers: true,
                },
            });
            console.log(`✅ Created admin user "${adminUsername}" with superadmin role`);
        }

        console.log("\n📊 Admin User Details:");
        console.log(`   Username: ${adminUser.username}`);
        console.log(`   UUID: ${adminUser.uuid}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Coins: ${adminUser.coins}`);
        console.log(`   Permissions:`, JSON.stringify(adminUser.permissions, null, 2));

        console.log("\n🎉 Admin setup complete!");
        console.log("Login credentials:");
        console.log(`   Username: ${adminUsername}`);
        console.log(`   Password: ${adminPassword}`);
        console.log("\n⚠️ Remember: Use /admin/login endpoint for admin login!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error setting up admin:", error);
        process.exit(1);
    }
}

setupAdmin();
