# setup.ps1

# Frontend setup
cd client
npm install
npm install zustand framer-motion @testing-library/react jest babel-jest @babel/core @babel/preset-env @babel/preset-react jest-environment-jsdom
cd ..

# Backend setup
cd server
npm install
npm install express mongoose jsonwebtoken cors dotenv
cd ..
