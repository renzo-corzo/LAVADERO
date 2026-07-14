-- AlterEnum: agrega el rol ADMIN (por encima de DUENO)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
