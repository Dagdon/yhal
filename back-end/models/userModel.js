import mysql from 'mysql2/promise';
import dbConfig from '../config/db';

// Define User model
class User {
  // constructor to initialize user properties
  constructor({
    firstName,
    lastName,
    email,
    password,
    resetToken = null,
    resetTokenExpiry = null,
    isVerified = false,
    verificationToken = null,
    verificationTokenExpiry = null,
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.resetToken = resetToken;
    this.resetTokenExpiry = resetTokenExpiry;
    this.isVerified = isVerified;
    this.verificationToken = verificationToken;
    this.verificationTokenExpiry = verificationTokenExpiry;
  }

  // create a new user
  static async create(user) {
    const connection = await mysql.createConnection(dbConfig); // Create a database connection
    const query = `
      INSERT INTO users (first_name, last_name, email, password, is_verified)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [user.firstName, user.lastName, user.email, user.password, false];

    try {
      const [result] = await connection.execute(query, values); // Execute the query
      return result.insertId; // Return the ID of the newly created user
    } finally {
      await connection.end(); // Close the database connection
    }
  }

  // find a user by email
  static async findByEmail(email) {
    const connection = await mysql.createConnection(dbConfig); // Create a database connection
    const query = `
      SELECT * FROM users
      WHERE email = ?
    `;
    const values = [email];

    try {
      const [rows] = await connection.execute(query, values); // Execute the query
      return rows[0] || null; // Return the user object or null if not found
    } finally {
      await connection.end(); // Close the database connection
    }
  }

  // Update User
  static async update(id, updatedUser) {
    const connection = await mysql.createConnection(dbConfig); // Create a database connection
    const query = `
      UPDATE users
      SET first_name = ?, last_name = ?, email = ?, password = ?,
          reset_token = ?, reset_token_expiry = ?
      WHERE id = ?
    `;
    const values = [
      updatedUser.firstName,
      updatedUser.lastName,
      updatedUser.email,
      updatedUser.password,
      updatedUser.resetToken,
      updatedUser.resetTokenExpiry,
      id,
    ];

    try {
      const [result] = await connection.execute(query, values); // Execute the query
      return result.affectedRows > 0; // Return true if the user was updated
    } finally {
      await connection.end(); // Close the database connection
    }
  }

  // Delete User by ID
  static async delete(id) {
    const connection = await mysql.createConnection(dbConfig); // Create a database connection
    const query = `
      DELETE FROM users
      WHERE id = ?
    `;
    const values = [id];

    try {
      const [result] = await connection.execute(query, values); // Execute the query
      return result.affectedRows > 0; // Return true if the user was deleted
    } finally {
      await connection.end(); // Close the database connection
    }
  }

  // Reset token methods
  static async setResetToken(email, token, expiry) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      UPDATE users
      SET reset_token = ?, reset_token_expiry = ?
      WHERE email = ?
    `;
    const values = [token, expiry, email];

    try {
      const [result] = await connection.execute(query, values);
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  static async clearResetToken(email) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      UPDATE users 
      SET reset_token = NULL, reset_token_expiry = NULL
      WHERE email = ?
    `;
    const values = [email];

    try {
      const [result] = await connection.execute(query, values);
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  static async findByResetToken(token) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT * FROM users 
      WHERE reset_token = ? 
      AND reset_token_expiry > NOW()
    `;
    const values = [token];

    try {
      const [rows] = await connection.execute(query, values);
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  // Email verification methods
  static async setVerificationToken(email, token) {
    const connection = await mysql.createConnection(dbConfig);
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const query = `
      UPDATE users
      SET verification_token = ?, verification_token_expiry = ?
      WHERE email = ?
    `;
    const values = [token, expiry, email];

    try {
      const [result] = await connection.execute(query, values);
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  static async findByVerificationToken(token) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT * FROM users 
      WHERE verification_token = ? 
      AND verification_token_expiry > NOW()
    `;
    const values = [token];

    try {
      const [rows] = await connection.execute(query, values);
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  static async verifyEmail(token) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      UPDATE users 
      SET is_verified = true, 
          verification_token = NULL, 
          verification_token_expiry = NULL
      WHERE verification_token = ? 
      AND verification_token_expiry > NOW()
    `;
    const values = [token];

    try {
      const [result] = await connection.execute(query, values);
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  static async clearVerificationToken(email) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `
      UPDATE users 
      SET verification_token = NULL, verification_token_expiry = NULL
      WHERE email = ?
    `;
    const values = [email];

    try {
      const [result] = await connection.execute(query, values);
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }
}

// Export the User model
export default User;
