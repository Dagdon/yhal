import mysql from 'mysql2/promise';
import dbConfig from '../config/db.js';

// Define User model
class User {
  // constructor to initialize user properties
  constructor({ firstName, lastName, email, password }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
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
			WHERE id = ?
		`;
    const values = [
      updatedUser.firstName,
      updatedUser.lastName,
      updatedUser.email,
      updatedUser.password,
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
}

// Export the User model as the default export
export default User;
