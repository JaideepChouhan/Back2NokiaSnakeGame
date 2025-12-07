package com.back2nokia.servlet;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;

/**
 * ClearSaveServlet - called by client at the start of a new run/game
 * Removes session attribute "saved_<subject>" so the user can save again for that subject.
 */
@WebServlet("/new-run")
public class ClearSaveServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);
        try (PrintWriter out = resp.getWriter()) {
            if (session == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"status\":\"error\",\"message\":\"Not logged in\"}");
                return;
            }
            String subject = req.getParameter("subject");
            if (subject == null || subject.trim().isEmpty()) subject = "general";
            String flag = "saved_" + subject;
            session.removeAttribute(flag);
            out.print("{\"status\":\"ok\",\"message\":\"cleared\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().print("{\"status\":\"error\",\"message\":\"server error\"}");
        }
    }
}