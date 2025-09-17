import pool from '../config/db.js'; // Database pool

class Food {
  // Create a new food item
  static async create({
    name, ingredients, calories, image,
  }) {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO foods (name, ingredients, calories, image)
      VALUES (?, ?, ?, ?)
    `;
    const values = [name, ingredients, calories, image];

    try {
      const [result] = await connection.execute(query, values); // Execute the query
      return result.insertId; // Return the ID of the newly created food item
    } finally {
      connection.release();
    }
  }

  // Find a food item by ID
  static async findById(id) {
    const connection = await pool.getConnection();
    const query = `
      SELECT * FROM foods
      WHERE id = ?
    `;
    const values = [id];

    try {
      const [rows] = await connection.execute(query, values); // Execute the query
      return rows[0] || null; // Return the food item or null if not found
    } finally {
      connection.release();
    }
  }

  // Find all food items
  static async findAll() {
    const connection = await pool.getConnection();
    const query = `
      SELECT * FROM foods
    `;

    try {
      const [rows] = await connection.execute(query); // Execute the query
      return rows; // Added return statement to fix the warning
    } finally {
      connection.release();
    }
  }

  // Update a food item
  static async update(id, {
    name, ingredients, calories, image,
  }) {
    const connection = await pool.getConnection();
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
      connection.release();
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
      await connection.end(); // Close the database connection
    }
  }
}

// Export the Food model as the default export
export default Food;
