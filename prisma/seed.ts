import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type SeedRow = {
  nim: string;
  nama: string;
  prodi: string;
  kelas: string;
  mitra: string;
  kota: string;
  zona: string;
  dosen: string;
};

const DOSEN_ACCOUNTS: Array<{ nama: string; email: string; password: string }> = [
  { nama: "AFU ICHSAN PRADANA", email: "afu@udb.ac.id", password: "Afu#2026x" },
  { nama: "EKO PURWANTO", email: "eko@udb.ac.id", password: "Eko#2026x" },
  { nama: "VIHI ATINA", email: "vihi@udb.ac.id", password: "Vihi#2026x" },
  { nama: "JONI MAULINDAR", email: "joni@udb.ac.id", password: "Joni#2026x" },
  { nama: "Bondan Wahyu Pamekas, S.Kom, M.Kom", email: "bondan@udb.ac.id", password: "Bondan#2026x" },
  { nama: "Aprilisa Arum Sari, S.T, M.Kom", email: "aprilisa@udb.ac.id", password: "Aprilisa#2026x" },
  { nama: "Sopingi, M.Kom", email: "sopingi@udb.ac.id", password: "Sopingi#2026x" },
  { nama: "NURMALITASARI", email: "nurmalitasari@udb.ac.id", password: "Nurma#2026x" },
  { nama: "Dwi Hartanti, S.Kom., M.Kom", email: "hartanti@udb.ac.id", password: "Hartanti#2026x" },
  { nama: "Marta Ardiyanto, S.Kom, M.Kom", email: "marta@udb.ac.id", password: "Marta#2026x" },
  { nama: "Triyono", email: "triyono@udb.ac.id", password: "Triyono#2026x" },
  { nama: "FAULINDA ELY NASTITI", email: "faulinda@udb.ac.id", password: "Faulinda#2026x" },
  { nama: "NURCHIM", email: "nurchim@udb.ac.id", password: "Nurchim#2026x" },
  { nama: "Ahmad Rifa'i, S.Kom, M.Kom", email: "rifai@udb.ac.id", password: "Rifai#2026x" },
  { nama: "Ridwan Dwi Irawan, S.Kom, M.Kom", email: "ridwan@udb.ac.id", password: "Ridwan#2026x" },
  { nama: "Nibras Faiq Muhammad", email: "nibras@udb.ac.id", password: "Nibras#2026x" },
  { nama: "HANIFAH PERMATASARI", email: "hanifah@udb.ac.id", password: "Hanifah#2026x" },
  { nama: "AGUSTINA SRIRAHAYU", email: "agustina@udb.ac.id", password: "Agustina#2026x" },
  { nama: "Pramono, S.Kom, M.Kom", email: "pramono@udb.ac.id", password: "Pramono#2026x" },
  { nama: "RUDI SUSANTO", email: "rudi@udb.ac.id", password: "Rudi#2026x" },
  { nama: "SRI SUMARLINDA", email: "sumarlinda@udb.ac.id", password: "Sumarlinda#2026x" },
  { nama: "WIJIYANTO", email: "wijiyanto@udb.ac.id", password: "Wijiyanto#2026x" },
  { nama: "INTAN OKTAVIANI", email: "intan@udb.ac.id", password: "Intan#2026x" },
  { nama: "MOH. MUHTAROM", email: "muhtarom@udb.ac.id", password: "Muhtarom#2026x" },
  { nama: "Herin Dwibima Aprianto, S.Kom, M.Kom", email: "herin@udb.ac.id", password: "Herin#2026x" },
  { nama: "Lubna, S.Kom, M.Kom", email: "lubna@udb.ac.id", password: "Lubna#2026x" },
];

async function main() {
  const dataPath = path.join(__dirname, "seed-data.json");
  const rows: SeedRow[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Admin
  const adminHash = bcrypt.hashSync("Admin#MBKM2026", 10);
  await prisma.user.upsert({
    where: { email: "admin@udb.ac.id" },
    update: {},
    create: { email: "admin@udb.ac.id", name: "Admin MBKM", passwordHash: adminHash, role: "ADMIN" },
  });

  // Dosen users
  const namaToUser = new Map<string, string>();
  for (const d of DOSEN_ACCOUNTS) {
    const hash = bcrypt.hashSync(d.password, 10);
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: { name: d.nama, isLecturer: true },
      create: { email: d.email, name: d.nama, passwordHash: hash, role: "DOSEN", isLecturer: true },
    });
    namaToUser.set(d.nama, u.id);
  }

  // Mahasiswa
  for (const r of rows) {
    const userId = namaToUser.get(r.dosen) ?? null;
    await prisma.mahasiswa.upsert({
      where: { nim: r.nim },
      update: { dosenNama: r.dosen, userId },
      create: {
        nim: r.nim,
        nama: r.nama,
        prodi: r.prodi,
        kelas: r.kelas,
        mitra: r.mitra,
        kota: r.kota,
        zona: r.zona,
        dosenNama: r.dosen,
        userId,
      },
    });
  }

  console.log(`Seeded: ${rows.length} mahasiswa, ${DOSEN_ACCOUNTS.length} dosen + 1 admin`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
