# 🪐 SANCHIT SHARMA — Portfolio

> **AI GRAPHIC DESIGNER × FRONTEND WEB DESIGNER**  
> An ultra-modern, high-performance portfolio featuring Apple-grade smooth frame-sequence canvas rendering, interactive category galleries, procedural IK cursor follower, and live SMTP email integration.

---

## 🌐 Live Demo
👉 **[Live Website Preview](https://sanchitsharma217-arch.github.io/Sanchit-Portfolio/)**  
👉 **[Local Server](http://localhost:3000/)**

---

## ✨ Features & Architecture

- **🪐 240-Frame Image Sequence Smooth Scroll Engine**:
  - High-DPI HTML5 Canvas background renderer displaying a 240-frame interactive animation synchronized with window scroll.
  - Custom Lerp interpolation (`0.15`) for Apple-level camera travel and liquid-smooth scrolling.

- **💼 Categorized Portfolio Showcase Grid**:
  - **Frontend Showcase**: Mini desktop browser screen displaying live iframe preview of [Havenix Architecture Studio](https://sanchitsharma217-arch.github.io/Havenix/) and FETC Web Platform.
  - **UI/UX Design Systems**: High-resolution design boards for Aurora Drive (Luxury Car Rental), Trekbest (Travel & Tours), and Luxora (Fine Jewelry).
  - **Category Galleries**: Photoshop Artworks, AI Asset Collections, and YouTube Thumbnails.
  - **Full-Screen Gallery Viewer Modal**: Interactive lightbox slider with navigation arrows, thumbnail strip, slide counter, and keyboard controls.

- **👤 About Section**:
  - Dual-role highlight tags, custom bio, and statistics.
  - High-definition portrait card with an exclusive **Black & White to Full Color** transition and **White Neon Glow** effect on cursor hover.

- **⚙️ Services Section**:
  - `01` Frontend Web Design
  - `02` Photoshop
  - `03` AI Assets
  - `04` Thumbnail Design
  - Interactive row hover expansion and staggered scroll reveal entrance animations.

- **📬 Contact Section & SMTP Integration**:
  - Interactive contact modal powered by Node.js, `nodemailer`, and `dotenv`.
  - Sends live project inquiries directly via Gmail SMTP to `sanchitsharma898811@gmail.com`.

- **🕷️ Procedural IK Spider Cursor Follower**:
  - 8-legged procedural spider powered by 2-segment Inverse Kinematics (IK).
  - Crawls, rotates, and takes realistic procedural steps following the user's cursor across the screen.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, CSS Grid & Flexbox), Vanilla JS (ES6+)
- **Canvas & Physics**: HTML5 Canvas 2D Context, Inverse Kinematics (IK) Solver, Lerp Easing Engine
- **Backend API**: Node.js Native HTTP Server, Nodemailer, Dotenv

---

## 🚀 Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sanchitsharma217-arch/Sanchit-Portfolio.git
   cd Sanchit-Portfolio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   PORT=3000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=sanchitsharma898811@gmail.com
   SMTP_PASS=your-app-password
   RECIPIENT_EMAIL=sanchitsharma898811@gmail.com
   ```

4. **Start Local Development Server**:
   ```bash
   npm start
   ```
   Open `http://localhost:3000/` in your browser.

---

## 📄 License
© 2026 **Sanchit Sharma**. All Rights Reserved.
