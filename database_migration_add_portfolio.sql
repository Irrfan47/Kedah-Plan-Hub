-- Database Migration: Add Portfolio Field to Users Table
-- This script adds a portfolio field to the users table

-- Add portfolio column to users table
ALTER TABLE users ADD COLUMN portfolio VARCHAR(255) DEFAULT NULL;

-- Add index for portfolio field for better query performance
CREATE INDEX idx_users_portfolio ON users(portfolio);

-- Update existing users with a default portfolio value if needed
-- UPDATE users SET portfolio = 'General' WHERE portfolio IS NULL;

-- Verify the change
DESCRIBE users;
