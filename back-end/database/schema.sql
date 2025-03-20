-- backend/database/schema.sql
CREATE DATABASE IF NOT EXISTS yhal;

USE yhal;

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50) NOT NULL,
	email VARCHAR(100) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the foods table
CREATE TABLE IF NOT EXISTS foods (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL, -- Name of the food item
	ingredients TEXT NOT NULL, -- List of ingredients
	calories INT NOT NULL, -- Calorie count
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for when the food item was created
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Timestamp for when the food item was last updated
);
