package com.back2nokia.servlet;

import com.back2nokia.dao.UserDAO;
import com.back2nokia.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.security.MessageDigest;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    private UserDAO userDAO = new UserDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String email = req.getParameter("email");

        if (username == null || password == null || username.trim().isEmpty() || password.trim().isEmpty()) {
            resp.sendRedirect("register.html?error=empty");
            return;
        }

        try {
            if (userDAO.findByUsername(username) != null) {
                resp.sendRedirect("register.html?error=exists");
                return;
            }
            User u = new User();
            u.setUsername(username.trim());
            u.setPasswordHash(hashPassword(password, username.trim())); // simple salted hash
            u.setEmail(email);
            boolean ok = userDAO.createUser(u);
            if (ok) {
                resp.sendRedirect("login.html?registered=1");
            } else {
                resp.sendRedirect("register.html?error=server");
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            resp.sendRedirect("register.html?error=server");
        }
    }

    // Simple SHA-256 hashing with username as salt. For production use BCrypt.
    private String hashPassword(String password, String salt) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String combined = password + ":" + salt;
        byte[] bytes = md.digest(combined.getBytes("UTF-8"));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}