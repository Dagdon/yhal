-- backend/database/schema.sql
CREATE DATABASE IF NOT EXISTS yhal;

USE yhal;

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50) NOT NULL,
	email VARCHAR(100) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	reset_token VARCHAR(255) NULL,               -- For password reset tokens
	reset_token_expiry DATETIME NULL,            -- Token expiration timestamp
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the foods table
CREATE TABLE IF NOT EXISTS foods (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL, -- Name of the food item
	ingredients TEXT NOT NULL, -- List of ingredients
	calories INT NOT NULL, -- Calorie count
	image_path VARCHAR(255), 
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for when the food item was created
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Timestamp for when the food item was last updated
);

-- Index for better performance on email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for reset token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token);
