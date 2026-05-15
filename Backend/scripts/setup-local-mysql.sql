-- Local dev MySQL bootstrap for Divya Yatra backend
-- Creates the database and a dedicated local user with permissions.

CREATE DATABASE IF NOT EXISTS divya_yatra;

CREATE USER IF NOT EXISTS 'divya_dev'@'localhost' IDENTIFIED BY 'divya_dev_password';
CREATE USER IF NOT EXISTS 'divya_dev'@'127.0.0.1' IDENTIFIED BY 'divya_dev_password';

GRANT ALL PRIVILEGES ON divya_yatra.* TO 'divya_dev'@'localhost';
GRANT ALL PRIVILEGES ON divya_yatra.* TO 'divya_dev'@'127.0.0.1';

FLUSH PRIVILEGES;
