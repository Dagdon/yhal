Yhal AI-Powered Nutritional Analysis
🌍 Overview

African Food Vision is a full-stack application that leverages computer vision and nutritional analysis to identify African dishes from images, extract ingredients, and calculate their calorie and nutrient content. Designed to promote healthier eating habits while preserving culinary traditions, the app supports regional variations of popular African dishes (e.g., Nigerian vs. Ghanaian Jollof, East African Ugali vs. West African Fufu).
🔍 Key Features

✅ AI-Powered Ingredient Detection – Uses a deep learning model (TensorFlow.js or custom-trained CNN) to recognize African dishes and extract ingredients from food images.

✅ Nutritional Breakdown – Calculates calories, proteins, carbs, and fats based on user-confirmed ingredients, with portion size adjustments.

✅ Regional Dish Recognition – Supports local variations (e.g., "Egusi Soup" in Nigeria vs. "Agushi" in Ghana).

✅ Smart Caching & Rate Limiting – Uses Redis to cache frequent requests and express-rate-limit to prevent API abuse.

✅ User-Friendly Workflow –

    📸 Upload a food image

    🖊️ Confirm/modify AI-detected ingredients

    📊 Get instant nutritional insights

🛠 Tech Stack
Backend (Node.js/Express)

    Computer Vision API – (TensorFlow.js, Clarifai, or custom-trained model)

    Redis – Caching for faster repeated requests

    JWT Authentication – Secure user sessions

    Rate Limiting – Prevents API overload

    Data Validation – Ensures accurate nutritional calculations

Frontend (React.js)

    Image Upload & Cropping – Optimized for mobile/web

    Interactive Ingredient Editor – Users can modify AI suggestions

    Nutrition Dashboard – Visualizes carbs, proteins, fats

Database (MySQL)

    Stores user food logs, regional dish data, and nutritional profiles.

Why This Project?
Problem Solved

    Many nutrition apps lack African cuisine databases, leading to inaccurate tracking.

    Manual calorie counting is tedious—AI automation speeds up the process.

    Promotes health awareness while respecting cultural food practices.

Technical Challenges Overcome

🔹 Handling regional dish variations (e.g., "Injera" vs. "Fufu") in the AI model.
🔹 Optimizing image processing for low-light food pics (common in African settings).
🔹 Balancing accuracy & speed—caching frequent requests without stale data.

📈 Future Improvements

    User Profiles – Save meal history and dietary preferences.

    B2B API – Let health apps integrate African food data.

    Mobile App – React Native version for offline use.

    Community-Driven Database – Crowdsource rare dishes.

👥 Contributing

PRs welcome! Focus areas:

    Improving AI model accuracy for West/East/South African cuisines

    Adding portion-size visual guides (e.g., "1 ladle = 200g")

    Optimizing Redis caching strategies