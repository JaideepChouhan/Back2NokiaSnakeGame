package com.back2nokia.servlet;

import com.back2nokia.dao.UserDAO;
import com.back2nokia.model.User;
import com.back2nokia.util.DBUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Debug-friendly LoginServlet:
 * - Logs exception stacktraces to server log (java.util.logging)
 * - For local dev only: can append a short error token to redirect for easier lookup.
 * REMOVE debug redirect behavior in production.
 */
@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(LoginServlet.class.getName());
    private UserDAO userDAO = new UserDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");

        try {
            if (username == null || password == null) {
                resp.sendRedirect("login.html?error=invalid");
                return;
            }

            User u = userDAO.findByUsername(username);
            if (u != null && u.getPasswordHash().equals(hashPassword(password, username))) {
                HttpSession s = req.getSession(true);
                s.setAttribute("userId", u.getId());
                s.setAttribute("username", u.getUsername());
                String encoded = URLEncoder.encode(u.getUsername(), StandardCharsets.UTF_8.toString());
                resp.sendRedirect("game.html?login=1&user=" + encoded);
                return;
            } else {
                resp.sendRedirect("login.html?error=invalid");
                return;
            }
        } catch (Exception ex) {
            // Log full stacktrace to server log for debugging
            LOGGER.log(Level.SEVERE, "Login failed for user: " + username, ex);

            // Optional: create a short token to correlate log entry and UI
            String token = UUID.randomUUID().toString().substring(0, 8);
            LOGGER.log(Level.SEVERE, "Error token: " + token + " (use this to find log entry)");

            // For development only: redirect with debug token so you can see it in browser and report it.
            // WARNING: Do NOT expose stacktraces or sensitive info in production.
            String qs = "error=server&et=" + URLEncoder.encode(token, StandardCharsets.UTF_8.toString());
            resp.sendRedirect("login.html?" + qs);
        }
    }

    private String hashPassword(String password, String salt) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String combined = password + ":" + salt;
        byte[] bytes = md.digest(combined.getBytes("UTF-8"));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}