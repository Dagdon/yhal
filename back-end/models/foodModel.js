import mysql from 'mysql2/promise'; // MySQL library for database operations
import dbConfig from '../config/db.js'; // Database configuration

class Food {
	// Create a new food item
	static async create({ name, ingredients, calories, image }) {
		const connection = await mysql.createConnection(dbConfig); // Create a database connection
		const query = `
			INSERT INTO foods (name, ingredients, calories, image)
			VALUES (?, ?, ?, ?)
		`;
		const values = [name, ingredients, calories, image];

		try {
			const [result] = await connection.execute(query, values); // Execute the query
			return result.insertId; // Return the ID of the newly created food item
		} finally {
			await connection.end(); // Close the database connection
		}
	}

	// Find a food item by ID
	static async findById(id) {
		const connection = await mysql.createConnection(dbConfig); // Create a database connection
		const query = `
			SELECT * FROM foods
			WHERE id = ?
		`;
		const values = [id];

		try {
			const [rows] = await connection.execute(query, values); // Execute the query
			return rows[0] || null; // Return the food item or null if not found
		} finally {
			await connection.end(); // Close the database connection
		}
	}

	// Find all food items
	static async findAll() {
		const connection = await mysql.createConnection(dbConfig); // Create a database connection
		const query = `
			SELECT * FROM foods
		`;

		try {
			const [rows] = await connection.execute(query); // Execute the query
			const [rows] = await connection.execute(query); // Execute the query
		} finally {
			await connection.end(); // Close the database connection
		}
	}

	// Update a food item
	static async update(id, { name, ingredients, calories, image }) {
		const connection = await mysql.createConnection(dbConfig); // Create a database connection
		const query = `
			UPDATE foods
			SET name = ?, ingredients = ?, calories = ?, image = ?
			WHERE id = ?
		`;
		const values = [name, ingredients, calories, image, id];

		try {
			const [result] = await connection.execute(query, values); // Execute the query
			return result.affectedRows > 0; // Return true if the food item was updated
		} finally {
			await connection.end(); // Close the database connection
		}
	}

	// Delete a food item by ID
	static async delete(id) {
		const connection = await mysql.createConnection(dbConfig); // Create a database connection
		const query = `
			DELETE FROM foods
			WHERE id = ?
		`;
		const values = [id];

		try {
			const [result] = await connection.execute(query, values); // Execute the query
			return result.affectedRows > 0; // Return true if the food item was deleted
		} finally {
			await connection.end(); // Close the database connectionexport default Food;
		}
	}
}

// Export the Food model as the default export
export default Food;
