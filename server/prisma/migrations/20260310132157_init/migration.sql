/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `patients` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL DEFAULT 'MALE',
    `age` INTEGER NULL,
    `date_of_birth` DATETIME(3) NULL,
    `id_card` VARCHAR(20) NULL,
    `phone` VARCHAR(20) NULL,
    `emergency_contact` JSON NULL,
    `address` VARCHAR(200) NULL,
    `insurance` VARCHAR(100) NULL,
    `blood_type` VARCHAR(20) NULL,
    `marital_status` VARCHAR(20) NULL,
    `occupation` VARCHAR(50) NULL,
    `education` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patients_id_card_key`(`id_card`),
    UNIQUE INDEX `patients_phone_key`(`phone`),
    INDEX `patients_name_idx`(`name`),
    INDEX `patients_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `type` ENUM('CHRONIC', 'SURGICAL', 'ALLERGY', 'FAMILY', 'VACCINATION') NOT NULL,
    `details` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `medical_history_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `current_symptoms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `main_complaint` VARCHAR(200) NOT NULL,
    `symptoms` JSON NOT NULL,
    `duration` VARCHAR(50) NULL,
    `severity` VARCHAR(50) NULL,
    `aggravating_factors` VARCHAR(100) NULL,
    `relieving_factors` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `current_symptoms_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_examination` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `vital_signs` VARCHAR(200) NULL,
    `general_appearance` VARCHAR(200) NULL,
    `head_and_neck` VARCHAR(200) NULL,
    `chest` VARCHAR(200) NULL,
    `cardiovascular` VARCHAR(200) NULL,
    `abdomen` VARCHAR(200) NULL,
    `extremities` VARCHAR(200) NULL,
    `neurological` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `physical_examination_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examination_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `laboratory_tests` VARCHAR(500) NULL,
    `imaging_studies` VARCHAR(500) NULL,
    `special_tests` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `examination_results_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnoses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `icd_code` VARCHAR(20) NULL,
    `diagnosis_name` VARCHAR(200) NOT NULL,
    `type` ENUM('PRIMARY', 'SECONDARY', 'DIFFERENTIAL') NOT NULL,
    `diagnosis_date` DATETIME(3) NULL,
    `doctor_name` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `diagnoses_patientId_idx`(`patientId`),
    INDEX `diagnoses_icd_code_idx`(`icd_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `medication` JSON NULL,
    `procedures` JSON NULL,
    `lifestyle_recommendations` JSON NULL,
    `follow_up_plan` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `treatment_plans_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `note_date` DATETIME(3) NOT NULL,
    `note_time` VARCHAR(8) NULL,
    `author` VARCHAR(50) NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('ADMISSION_RECORD', 'PROGRESS_RECORD', 'SURGERY_RECORD', 'DISCHARGE_RECORD') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `progress_notes_patientId_idx`(`patientId`),
    INDEX `progress_notes_note_date_idx`(`note_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `total_cost` DOUBLE NULL,
    `insurance_coverage` DOUBLE NULL,
    `self_payment` DOUBLE NULL,
    `paymentStatus` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL,
    `payment_history` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `financial_info_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` VARCHAR(20) NOT NULL,
    `primary_physician` JSON NULL,
    `nurse` JSON NULL,
    `specialists` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `medical_team_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medical_history` ADD CONSTRAINT `medical_history_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `current_symptoms` ADD CONSTRAINT `current_symptoms_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `physical_examination` ADD CONSTRAINT `physical_examination_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_results` ADD CONSTRAINT `examination_results_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnoses` ADD CONSTRAINT `diagnoses_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_plans` ADD CONSTRAINT `treatment_plans_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_notes` ADD CONSTRAINT `progress_notes_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_info` ADD CONSTRAINT `financial_info_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_team` ADD CONSTRAINT `medical_team_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
