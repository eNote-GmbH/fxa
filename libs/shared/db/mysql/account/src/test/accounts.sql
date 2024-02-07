CREATE TABLE `accounts` (
  `uid` binary(16) NOT NULL,
  `normalizedEmail` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `emailCode` binary(16) NOT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `kA` binary(32) NOT NULL,
  `wrapWrapKb` binary(32) NOT NULL,
  `authSalt` binary(32) NOT NULL,
  `verifyHash` binary(32) NOT NULL,
  `verifierVersion` tinyint(3) unsigned NOT NULL,
  `verifierSetAt` bigint(20) unsigned NOT NULL,
  `createdAt` bigint(20) unsigned NOT NULL,
  `locale` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lockedAt` bigint(20) unsigned DEFAULT NULL,
  `profileChangedAt` bigint(20) unsigned DEFAULT NULL,
  `keysChangedAt` bigint(20) unsigned DEFAULT NULL,
  `ecosystemAnonId` text CHARACTER SET ascii COLLATE ascii_bin,
  `disabledAt` bigint(20) unsigned DEFAULT NULL,
  `metricsOptOutAt` bigint(20) unsigned DEFAULT NULL,
  `atLeast18AtReg` tinyint(1) unsigned DEFAULT NULL,
  `clientSalt` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `verifyHashVersion2` binary(32) DEFAULT NULL,
  `wrapWrapKbVersion2` binary(32) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `normalizedEmail` (`normalizedEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
