
🚀 Realtime Code Collab
A live collaborative coding platform that lets multiple users write, edit, and execute code together in real-time — all in the browser.

Built with React, Express, and Socket.IO, this project now also supports code execution with custom input using the Piston API, giving users a truly interactive coding experience.

🔗 Live App Links

Frontend: https://livecode-m9q7.onrender.com

Backend: https://livecode-q3s6.onrender.com

💡 Key Features
🔗 Join & Create Rooms
Users can create or join any room using a custom room name.

All code and interactions within a room are isolated and synced only among its participants.

🧠 Real-Time Collaboration
Changes made by any user in a room are broadcasted live to everyone else instantly using Socket.IO.

Typing indicators show who is currently typing.

👥 Active User Presence
Display of all connected users in the room — so you always know who’s coding with you.

🌐 Language Synchronization
Code language selection (e.g., Python, C++, JavaScript, etc.) is shared across the room, keeping everyone in sync.

🖥️ Code Execution (via Piston API)
Write custom input, execute code, and view live output.

Supports multiple languages through the Piston API.

Output is returned and displayed directly in the interface — useful for testing, debugging, or learning collaboratively.

🧱 Tech Stack
Layer	Technology
Frontend	React (with Vite bundler)
Backend	Express.js (Node.js with ESM)
Realtime	Socket.IO
Execution	Piston API
