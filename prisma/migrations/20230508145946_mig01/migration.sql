-- AlterTable
ALTER TABLE `user` ADD COLUMN `secret_tfa` VARCHAR(191) NULL,
    ADD COLUMN `tfa` BOOLEAN NULL;

-- CreateTable
CREATE TABLE `password_recovery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_recovery` ADD CONSTRAINT `password_recovery_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
