-- 1. Bukti: per perusahaan (mitra), bukan per mahasiswa
ALTER TABLE `Bukti` ADD COLUMN `mitra` VARCHAR(191) NOT NULL DEFAULT '';

UPDATE `Bukti` b
  JOIN `Mahasiswa` m ON b.`mahasiswaId` = m.`id`
  SET b.`mitra` = m.`mitra`;

ALTER TABLE `Bukti` DROP FOREIGN KEY `Bukti_mahasiswaId_fkey`;
ALTER TABLE `Bukti` DROP COLUMN `mahasiswaId`;
ALTER TABLE `Bukti` ADD INDEX `Bukti_mitra_idx` (`mitra`);

-- 2. Role SUPERADMIN
ALTER TABLE `User` MODIFY `role` ENUM('SUPERADMIN','ADMIN','DOSEN') NOT NULL DEFAULT 'DOSEN';
