CREATE DATABASE IF NOT EXISTS yhal;

USE yhal;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Updated foods table with user tracking and caching
CREATE TABLE IF NOT EXISTS foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                      -- Links to users table
    name VARCHAR(100) NOT NULL,
    ingredients TEXT NOT NULL,
    calories INT NOT NULL,
    image_path VARCHAR(255),
    frequency_count INT DEFAULT 1,             -- Tracks how often food is scanned
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Last scan time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tracks each instance of consumed meals
CREATE TABLE IF NOT EXISTS meal_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                      -- Links to user
    food_id INT NOT NULL,                      -- Links to foods table
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When meal was eaten
    notes TEXT NULL,                           -- Optional user notes
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (food_id) REFERENCES foods(id)
);

-- Email verification additions
ALTER TABLE users 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN verification_token_expiry DATETIME DEFAULT NULL;

-- Index optimizations
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_reset_token ON users(reset_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_foods_user ON foods(user_id);               -- Faster user food queries
CREATE INDEX idx_foods_frequency ON foods(frequency_count);  -- For cached suggestions