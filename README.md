# ScanGo - Manga Reader Application 📖

ScanGo is a modern, full-stack web application designed for manga enthusiasts. Inspired by platforms like MangaDex, it provides a seamless experience for discovering, reading, and discussing your favorite manga. The project integrates real-time data from the MangaDex API and includes an AI-powered chatbot to assist users.

## ✨ Core Features

* **Discover & Read**:
    * Browse **trending mangas** directly on the homepage, powered by the MangaDex API.
    * Use the **advanced search** to find manga by title or genre. 
    * An intuitive and clean reader for an immersive chapter reading experience.

* **User Interaction**:
    * **Full user account system** with secure registration and login (passwords hashed with `bcrypt`). 
    * Engage with the community by **posting comments** on each chapter.
    * Keep track of your reading history and favorite series.

* **Profile Customization**:
    * Personalize your profile with a custom **username, banner, and profile picture**.
    * Manage your account settings, including your password.

* **🤖 AI Chatbot Assistant**:
    * An integrated chatbot to help users navigate the site, find manga, or get recommendations. 

---

## 🛠️ Technology Stack

The project is built with a modern and robust technology stack:

* **Frontend**:
    * **React**: For building a dynamic and responsive user interface.
    * **React Router**: To handle client-side navigation between pages.

* **Backend**:
    * **Golang**: For a high-performance, concurrent server.
    * **REST API**: A resource-based API for handling all client-server communication.

* **Database**:
    * **MongoDB**: A NoSQL database to store user data, comments, and preferences.

* **External APIs & Services**:
    * **MangaDex API**: To fetch comprehensive data about manga, chapters, covers, etc.
    * **Cloudinary**: For cloud-based management and delivery of user-uploaded images (profile pictures, banners).

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js & npm
* Go
* MongoDB

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/Tinshea/ScanGo.git](https://github.com/Tinshea/ScanGo.git)
    cd ScanGo
    ```

2.  **Frontend Setup**
    ```sh
    cd client 
    npm install
    npm start
    ```

3.  **Backend Setup**
    ```sh
    cd server
    go run main.go
    ```
