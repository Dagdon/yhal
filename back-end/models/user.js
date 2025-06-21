import mysql from 'mysql2/promise';
import dbConfig from '../config/db.js';

// Define User model
class User {
  // constructor to initialize user properties
  constructor({
    firstName, lastName, email, password, resetToken = null, resetTokenExpiry = null,
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.resetToken = resetToken;
    this.resetTokenExpiry = resetTokenExpiry;
  }

  // create a new user
  static async create(user) {
    const connection = await mysql.createConnection(dbConfig); // Create a database connection
    const query = `
      INSERT INTO users (first_name, last_name, email, password)
      VALUES (?, ?, ?, ?)
    `;
    const values = [user.firstName, user.lastName, user.email, user.password];

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
      SET first_name = ?, last_name = ?, email = ?, password = ?
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
}

// Export the User model as the default export
export default User;
