SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `credentials` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(40) NOT NULL,
  `email` varchar(60) NOT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `session_token` varchar(50) DEFAULT NULL,
  `session_valid_until` datetime DEFAULT NULL,
  `activated` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `dailies` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `login` date DEFAULT NULL,
  `victory` date DEFAULT NULL,
  `game` date DEFAULT NULL,
  `energy` date DEFAULT NULL,
  `ships` date DEFAULT NULL,
  `domination` date DEFAULT NULL,
  `destruction` date DEFAULT NULL,
  `control` date DEFAULT NULL,
  `juggernaut` date DEFAULT NULL,
  `stations` date DEFAULT NULL,
  `discard` date DEFAULT NULL,
  `colony` date DEFAULT NULL,
  `colossus` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `decks` (
  `card_instance_id` bigint(20) UNSIGNED NOT NULL,
  `card_id` smallint(7) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `in_use` tinyint(1) NOT NULL DEFAULT 0,
  `tradeable` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `items` (
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(30) NOT NULL,
  `message` varchar(300) DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `magic_links` (
  `id` uuid NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(30) NOT NULL,
  `value` varchar(1000) DEFAULT NULL,
  `valid_until` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `profiles` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `newsletter` tinyint(1) NOT NULL DEFAULT 0,
  `sol` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


ALTER TABLE `credentials`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `session_token` (`session_token`);

ALTER TABLE `dailies`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `decks`
  ADD PRIMARY KEY (`card_instance_id`),
  ADD UNIQUE KEY `card_instance_id` (`card_instance_id`),
  ADD KEY `user_card_id` (`card_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `magic_links`
  ADD PRIMARY KEY (`id`),
  ADD KEY `magic_links_user_id` (`user_id`);

ALTER TABLE `profiles`
  ADD PRIMARY KEY (`user_id`);


ALTER TABLE `credentials`
  MODIFY `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `decks`
  MODIFY `card_instance_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `items`
  MODIFY `item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;


ALTER TABLE `dailies`
  ADD CONSTRAINT `dailies_user_id` FOREIGN KEY (`user_id`) REFERENCES `credentials` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `decks`
  ADD CONSTRAINT `decks_user_id` FOREIGN KEY (`user_id`) REFERENCES `credentials` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `items`
  ADD CONSTRAINT `items_user_id` FOREIGN KEY (`user_id`) REFERENCES `credentials` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `magic_links`
  ADD CONSTRAINT `magic_links_user_id` FOREIGN KEY (`user_id`) REFERENCES `credentials` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `credentials` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
