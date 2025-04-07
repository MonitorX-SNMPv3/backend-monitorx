import Users from "../models/Users.js";
import db from "../config/database.js";

const seedUsers = async () => {
    try {
        // Pastikan koneksi database tersedia
        await db.authenticate();
        console.log(`[${new Date().toLocaleString()}] - Database connected...`);

        // Opsional: Hapus semua data sebelum seeding
        await Users.destroy({ where: {}, force: true });

        // Data yang akan di-seed
        const users = [
            {
                type: "ADMIN",
                name: "Admin 1",
                email: "admin@example.com",
                password: "$argon2id$v=19$m=65536,t=3,p=4$WF+mtERM5H1UF7Zbvc8KDw$HgaQPiZxfQ0mGocNL3nbUYopXIyS1j5kU2SsmaGm40M", //admin123
            },
            {
                type: "USER",
                name: "Pengguna 1",
                email: "user@example.com",
                password: "$argon2id$v=19$m=65536,t=3,p=4$rcX3dfEMOAzfHPu4A3Mg1A$HhIKParzIVSJHFVLLDFoWT9eNIEKeeCPmRnk93lFXnE", //password123
            },
        ];

        // Masukkan data ke dalam database
        await Users.bulkCreate(users);
        console.log(`[${new Date().toLocaleString()}] - Users seeded successfully.`);

        // Tutup koneksi database
        await db.close();
    } catch (error) {
        console.error("Seeding error:", error);
    }
};

// Jalankan seeding jika file ini dieksekusi langsung
if (import.meta.url === `file://${process.argv[1]}`) {
    seedUsers();
}
