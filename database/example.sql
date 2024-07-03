-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (x86_64)
--
-- Host: localhost    Database: moneymachine
-- ------------------------------------------------------
-- Server version	8.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('861da6e8-9801-4c0e-902a-5300501db32f','378297cc849e8fc287343bddbd17f644b3afcc45088428eaa565cbb16203fe8f','2024-07-01 14:33:10.551','20240701143310_',NULL,NULL,'2024-07-01 14:33:10.479',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RootOrder`
--

DROP TABLE IF EXISTS `RootOrder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RootOrder` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `side` enum('SELL','BUY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entryPrice` double NOT NULL,
  `qty` double NOT NULL,
  `budget` double NOT NULL,
  `status` enum('ACTIVE','EXPIRED','FINISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `profit` double DEFAULT NULL,
  `markPrice` double DEFAULT NULL,
  `strategyId` int NOT NULL,
  `currentTargetId` int DEFAULT NULL,
  `tokenId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RootOrder_orderId_key` (`orderId`),
  KEY `RootOrder_strategyId_fkey` (`strategyId`),
  KEY `RootOrder_currentTargetId_fkey` (`currentTargetId`),
  KEY `RootOrder_tokenId_fkey` (`tokenId`),
  CONSTRAINT `RootOrder_currentTargetId_fkey` FOREIGN KEY (`currentTargetId`) REFERENCES `Target` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `RootOrder_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `RootOrder_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RootOrder`
--

LOCK TABLES `RootOrder` WRITE;
/*!40000 ALTER TABLE `RootOrder` DISABLE KEYS */;
/*!40000 ALTER TABLE `RootOrder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `StopLoss`
--

DROP TABLE IF EXISTS `StopLoss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `StopLoss` (
  `id` int NOT NULL AUTO_INCREMENT,
  `percent` double NOT NULL,
  `qtyPercent` double NOT NULL,
  `targetId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `StopLoss_targetId_fkey` (`targetId`),
  CONSTRAINT `StopLoss_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `Target` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `StopLoss`
--

LOCK TABLES `StopLoss` WRITE;
/*!40000 ALTER TABLE `StopLoss` DISABLE KEYS */;
INSERT INTO `StopLoss` VALUES (1,-5,0.5,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(2,-7,0.5,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(3,-3,0.5,2,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(4,0,0.5,2,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(5,3,1,3,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(6,10,1,4,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601');
/*!40000 ALTER TABLE `StopLoss` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Strategy`
--

DROP TABLE IF EXISTS `Strategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Strategy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contribution` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Strategy`
--

LOCK TABLES `Strategy` WRITE;
/*!40000 ALTER TABLE `Strategy` DISABLE KEYS */;
INSERT INTO `Strategy` VALUES (1,'EMA',33,'2023-09-29 20:08:51.000','2024-06-26 14:26:13.152');
/*!40000 ALTER TABLE `Strategy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SubOrder`
--

DROP TABLE IF EXISTS `SubOrder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SubOrder` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `side` enum('SELL','BUY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `markPrice` double NOT NULL,
  `timestamp` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` double NOT NULL,
  `budget` double NOT NULL,
  `status` enum('ACTIVE','EXPIRED','FINISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `profit` double DEFAULT NULL,
  `stopLossId` int DEFAULT NULL,
  `rootOrderId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SubOrder_orderId_key` (`orderId`),
  KEY `SubOrder_stopLossId_fkey` (`stopLossId`),
  KEY `SubOrder_rootOrderId_fkey` (`rootOrderId`),
  CONSTRAINT `SubOrder_rootOrderId_fkey` FOREIGN KEY (`rootOrderId`) REFERENCES `RootOrder` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SubOrder_stopLossId_fkey` FOREIGN KEY (`stopLossId`) REFERENCES `StopLoss` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SubOrder`
--

LOCK TABLES `SubOrder` WRITE;
/*!40000 ALTER TABLE `SubOrder` DISABLE KEYS */;
/*!40000 ALTER TABLE `SubOrder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Target`
--

DROP TABLE IF EXISTS `Target`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `percent` double NOT NULL,
  `tokenId` int DEFAULT NULL,
  `strategyId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Target_tokenId_fkey` (`tokenId`),
  KEY `Target_strategyId_fkey` (`strategyId`),
  CONSTRAINT `Target_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Target_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Target`
--

LOCK TABLES `Target` WRITE;
/*!40000 ALTER TABLE `Target` DISABLE KEYS */;
INSERT INTO `Target` VALUES (1,0,1,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(2,3,1,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(3,5,1,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(4,10,1,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601');
/*!40000 ALTER TABLE `Target` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Token`
--

DROP TABLE IF EXISTS `Token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stable` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precision` double NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Token`
--

LOCK TABLES `Token` WRITE;
/*!40000 ALTER TABLE `Token` DISABLE KEYS */;
INSERT INTO `Token` VALUES (1,'ETH','USDT',2,1,'2023-09-29 20:08:51.000','2024-06-20 13:30:58.601'),(2,'BTC','USDT',1,0,'2023-09-29 20:08:51.000','2023-09-29 20:08:51.000'),(3,'BNB','USDT',2,0,'2023-09-29 20:08:51.000','2024-06-20 14:53:14.548'),(4,'SOL','USDT',3,0,'2023-09-29 20:08:51.000','2024-06-20 14:53:14.550');
/*!40000 ALTER TABLE `Token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TokenData`
--

DROP TABLE IF EXISTS `TokenData`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TokenData` (
  `id` int NOT NULL AUTO_INCREMENT,
  `open` double NOT NULL,
  `close` double NOT NULL,
  `high` double NOT NULL,
  `low` double NOT NULL,
  `volume` double NOT NULL,
  `indicators` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TokenData_tokenId_fkey` (`tokenId`),
  CONSTRAINT `TokenData_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TokenData`
--

LOCK TABLES `TokenData` WRITE;
/*!40000 ALTER TABLE `TokenData` DISABLE KEYS */;
/*!40000 ALTER TABLE `TokenData` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TokenStrategy`
--

DROP TABLE IF EXISTS `TokenStrategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TokenStrategy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tokenId` int DEFAULT NULL,
  `strategyId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TokenStrategy_tokenId_fkey` (`tokenId`),
  KEY `TokenStrategy_strategyId_fkey` (`strategyId`),
  CONSTRAINT `TokenStrategy_strategyId_fkey` FOREIGN KEY (`strategyId`) REFERENCES `Strategy` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TokenStrategy_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `Token` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TokenStrategy`
--

LOCK TABLES `TokenStrategy` WRITE;
/*!40000 ALTER TABLE `TokenStrategy` DISABLE KEYS */;
INSERT INTO `TokenStrategy` VALUES (1,1,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(2,2,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(3,3,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601'),(4,4,1,'2024-06-20 13:30:58.601','2024-06-20 13:30:58.601');
/*!40000 ALTER TABLE `TokenStrategy` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-07-01 10:54:10
