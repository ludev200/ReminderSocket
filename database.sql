-- Table user

CREATE TABLE `user`
(
  `id` Varchar(36) NOT NULL,
  `email` Varchar(200) NOT NULL,
  `name` Varchar(50) NOT NULL,
  `username` Varchar(20) DEFAULT NULL,
  `password` Text DEFAULT NULL,
  `google_id` Varchar(255) DEFAULT NULL,
  `profile_picture` Varchar(255) DEFAULT NULL
)
;

ALTER TABLE `user` ADD PRIMARY KEY (`id`)
;



-- Table session

CREATE TABLE `session`
(
  `id` Int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` Varchar(36) NOT NULL,
  `token` Text NOT NULL,
  `expires_at` Datetime NOT NULL,
  `created_at` Datetime NOT NULL,
  PRIMARY KEY (`id`)
)
;

CREATE INDEX `IX_Relationship1` ON `session` (`user_id`)
;
ALTER TABLE `session` ADD CONSTRAINT `Relationship1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
;
